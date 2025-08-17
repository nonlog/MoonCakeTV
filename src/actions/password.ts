"server only";

import { verifyJwt } from "@/utils/jwt";

export const validatePasswordAction = async ({
  mc_auth_token,
}: {
  mc_auth_token?: string;
}) => {
  if (!mc_auth_token) {
    return {
      success: false,
      error: "mc_auth_token is required",
    };
  }

  const passwordMode = process.env.PASSWORD_MODE?.trim() ?? "local";

  if (passwordMode === "local") {
    return {
      success: false,
      error: "local模式不要使用此函数",
    };
  }

  if (passwordMode === "env") {
    const isValidated =
      !!mc_auth_token && process.env.MY_PASSWORD?.trim() === mc_auth_token;
    return {
      success: isValidated,
      error: `密码验证${isValidated ? "成功" : "失败"}`,
    };
  }

  if (passwordMode === "db") {
    const isValidated = await verifyJwt(mc_auth_token);

    return {
      success: !!isValidated,
      error: `密码验证${isValidated ? "成功" : "失败"}`,
    };
  }

  return {
    success: false,
    error: "密码模式只有三种：local, env, db",
  };
};
