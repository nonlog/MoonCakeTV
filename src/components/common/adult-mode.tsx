'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { MdOutlineNoAdultContent } from 'react-icons/md';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { useUserStore } from '@/stores/user';

export const useAdultModeToggle = () => {
  const { localPassword, setAdultMode } = useUserStore();
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [password, setPassword] = useState('');

  const handleAdultModeToggle = () => {
    if (!localPassword) {
      toast.error('未设置密码', {
        description: '请先在设置页面设置本地密码。',
        action: {
          label: '前往设置',
          onClick: () => {
            const settingsButton = document.querySelector(
              '#settings-button-container',
            ) as HTMLDivElement;
            settingsButton?.click();
          },
        },
      });
      return;
    }

    setIsDialogOpen(true);
  };

  const handleConfirm = () => {
    if (password === localPassword) {
      setAdultMode(new Date().toISOString());
      toast.success('成人模式已启用', {
        position: 'top-center',
      });
      setIsDialogOpen(false);
      setPassword('');
    } else {
      toast.error('密码错误');
    }
  };

  const handleCancel = () => {
    setIsDialogOpen(false);
    setPassword('');
  };

  const handleOpenChange = (o: boolean) => {
    if (!o) {
      setIsDialogOpen(false);
      setPassword('');
    }
  };

  const AdultModeDialog = () => (
    <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>
            <MdOutlineNoAdultContent />
          </DialogTitle>
          <DialogDescription>
            请输入您的本地密码以确认启用成人模式。
          </DialogDescription>
        </DialogHeader>
        <div className='grid gap-4 py-4'>
          <div className='grid grid-cols-4 items-center gap-4'>
            <Label htmlFor='password' className='text-right'>
              密码
            </Label>
            <Input
              id='password'
              type='password'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className='col-span-3'
              placeholder='请输入本地密码'
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleConfirm();
                }
              }}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={handleCancel}>
            取消
          </Button>
          <Button onClick={handleConfirm}>确认</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return { handleAdultModeToggle, AdultModeDialog };
};
