"use client";

import { RefreshCw, Shield, Trash2, User, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import PageLayout from "@/components/common/page-layout";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface UserListItem {
  username: string;
  role: "admin" | "user";
  bookmarksCount: number;
  historyCount: number;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      const json = await res.json();

      if (res.ok && json.data) {
        setUsers(json.data);
      } else {
        toast.error(json.message || "获取用户列表失败");
      }
    } catch {
      toast.error("获取用户列表失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async () => {
    if (!newUsername.trim()) {
      toast.error("请输入用户名");
      return;
    }
    if (!newPassword.trim()) {
      toast.error("请输入密码");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/admin/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: newUsername.trim(),
          password: newPassword.trim(),
        }),
      });

      const json = await res.json();

      if (res.ok) {
        toast.success(json.message || "用户创建成功");
        setIsCreateDialogOpen(false);
        setNewUsername("");
        setNewPassword("");
        fetchUsers();
      } else {
        toast.error(json.message || "创建用户失败");
      }
    } catch {
      toast.error("创建用户失败");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    setDeleting(true);
    try {
      const res = await fetch(
        `/api/admin/users?username=${encodeURIComponent(userToDelete)}`,
        { method: "DELETE" },
      );

      const json = await res.json();

      if (res.ok) {
        toast.success(json.message || "用户已删除");
        setIsDeleteDialogOpen(false);
        setUserToDelete(null);
        fetchUsers();
      } else {
        toast.error(json.message || "删除用户失败");
      }
    } catch {
      toast.error("删除用户失败");
    } finally {
      setDeleting(false);
    }
  };

  const openDeleteDialog = (username: string) => {
    setUserToDelete(username);
    setIsDeleteDialogOpen(true);
  };

  return (
    <PageLayout activePath='/admin/users'>
      <div className='container mx-auto px-4 py-8'>
        <div className='max-w-4xl mx-auto'>
          <div className='flex items-center justify-between mb-8'>
            <h1 className='text-3xl font-bold text-gray-900 dark:text-gray-100'>
              用户管理
            </h1>
            <div className='flex gap-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={fetchUsers}
                disabled={loading}
                className='cursor-pointer'
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
                />
                刷新
              </Button>
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                className='cursor-pointer'
              >
                <UserPlus className='w-4 h-4 mr-2' />
                添加用户
              </Button>
            </div>
          </div>

          <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 px-4'>
            {loading ? (
              <div className='p-8 text-center text-gray-500'>加载中...</div>
            ) : users.length === 0 ? (
              <div className='p-8 text-center text-gray-500'>暂无用户</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>用户名</TableHead>
                    <TableHead>角色</TableHead>
                    <TableHead className='text-center'>收藏数</TableHead>
                    <TableHead className='text-center'>历史记录</TableHead>
                    <TableHead className='text-right'>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.username}>
                      <TableCell className='font-medium'>
                        {user.username}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            user.role === "admin"
                              ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                              : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                          }`}
                        >
                          {user.role === "admin" ? (
                            <Shield className='w-3 h-3' />
                          ) : (
                            <User className='w-3 h-3' />
                          )}
                          {user.role === "admin" ? "管理员" : "普通用户"}
                        </span>
                      </TableCell>
                      <TableCell className='text-center'>
                        {user.bookmarksCount}
                      </TableCell>
                      <TableCell className='text-center'>
                        {user.historyCount}
                      </TableCell>
                      <TableCell className='text-right'>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => openDeleteDialog(user.username)}
                          className='cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20'
                        >
                          <Trash2 className='w-4 h-4' />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </div>

      {/* Create User Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加新用户</DialogTitle>
            <DialogDescription>
              创建一个新的用户账户。新用户默认为普通用户角色。
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <div className='space-y-2'>
              <label
                htmlFor='new-username'
                className='text-sm font-medium text-gray-700 dark:text-gray-300'
              >
                用户名
              </label>
              <Input
                id='new-username'
                placeholder='请输入用户名（至少3个字符）'
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                autoFocus
              />
            </div>
            <div className='space-y-2'>
              <label
                htmlFor='new-password'
                className='text-sm font-medium text-gray-700 dark:text-gray-300'
              >
                密码
              </label>
              <Input
                id='new-password'
                type='password'
                placeholder='请输入密码（至少6个字符）'
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setIsCreateDialogOpen(false)}
              className='cursor-pointer'
            >
              取消
            </Button>
            <Button
              onClick={handleCreateUser}
              disabled={creating}
              className='cursor-pointer'
            >
              {creating ? "创建中..." : "创建"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除用户</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除用户 <strong>{userToDelete}</strong>{" "}
              吗？此操作无法撤销，该用户的所有数据（收藏、观看历史等）将被永久删除。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className='cursor-pointer'>
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={deleting}
              className='cursor-pointer bg-red-600 hover:bg-red-700 text-white'
            >
              {deleting ? "删除中..." : "删除"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageLayout>
  );
}
