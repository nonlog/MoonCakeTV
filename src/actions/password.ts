"server only";

// ! TODO: use async await for db
export const validatePassword = (pw?: string) => {
  const passwordMode = process.env.PASSWORD_MODE ?? "local";

  if (passwordMode === "local") {
    return {
      success: false,
      error: "local模式不要使用此函数",
    };
  }

  if (passwordMode === "env") {
    const isValidated = !!pw && process.env.MY_PASSWORD === pw;
    return {
      success: isValidated,
      error: `密码验证${isValidated ? "成功" : "失败"}`,
    };
  }

  if (passwordMode === "db") {
    return {
      success: false,
      error: "敬请稍后",
    };
  }

  return {
    success: false,
    error: "密码模式只有三种：local, env, db",
  };
};
