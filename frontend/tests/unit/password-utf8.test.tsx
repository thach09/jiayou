import { render, fireEvent, screen } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import { passwordLengthError } from '../../src/features/auth/passwordValidation';
import { AuthModal } from '../../src/features/auth/AuthModal';
import { ChangePasswordModal } from '../../src/features/auth/ChangePasswordModal';
const api = vi.hoisted(() => ({register:vi.fn(), login:vi.fn(), password:vi.fn()}));
vi.mock('../../src/features/auth/api',()=>({authApi:api}));
test('UTF-8 boundary includes multibyte and four-byte characters without truncation',()=>{
  expect(passwordLengthError('界'.repeat(24))).toBeNull();
  expect(passwordLengthError('界'.repeat(25))).toContain('rút ngắn');
  expect(passwordLengthError('🦊'.repeat(18))).toBeNull();
  expect(passwordLengthError('🦊'.repeat(19))).toContain('rút ngắn');
});
test('registration explains an overlong Unicode password without sending credentials',()=>{
  render(<AuthModal isOpen initialMode="register" onClose={vi.fn()} onAuthSuccess={vi.fn()}/>);
  fireEvent.change(screen.getByLabelText('Họ và tên'),{target:{value:'Local fixture'}});
  fireEvent.change(screen.getByLabelText('Email'),{target:{value:'utf8@jiayou.test'}});
  fireEvent.change(screen.getByLabelText('Mật khẩu'),{target:{value:'界'.repeat(25)}});
  fireEvent.submit(document.querySelector('form')!);
  expect(screen.getByText(/Mật khẩu quá dài/)).toBeTruthy();
  expect(api.register).not.toHaveBeenCalled();
});
test('password change validation preserves the current session and never posts an invalid replacement',()=>{
  const changed=vi.fn();render(<ChangePasswordModal onClose={vi.fn()} onChanged={changed}/>);
  fireEvent.change(screen.getByLabelText('Mật khẩu hiện tại'),{target:{value:'BeforeBoundary123!'}});
  fireEvent.change(screen.getByLabelText('Mật khẩu mới',{exact:true}),{target:{value:'界'.repeat(25)}});
  fireEvent.change(screen.getByLabelText('Nhập lại mật khẩu mới'),{target:{value:'界'.repeat(25)}});
  fireEvent.submit(document.querySelector('form')!);
  expect(screen.getByRole('alert').textContent).toContain('rút ngắn');
  expect(api.password).not.toHaveBeenCalled();expect(changed).not.toHaveBeenCalled();
});

test('login rejects a suffix beyond the byte boundary before sending credentials',()=>{
  render(<AuthModal isOpen onClose={vi.fn()} onAuthSuccess={vi.fn()}/>);
  fireEvent.change(screen.getByLabelText('Email'),{target:{value:'utf8@jiayou.test'}});
  fireEvent.change(screen.getByLabelText('Mật khẩu'),{target:{value:'界'.repeat(24)+'x'}});
  fireEvent.submit(document.querySelector('form')!);
  expect(screen.getByText(/Mật khẩu quá dài/)).toBeTruthy();
  expect(api.login).not.toHaveBeenCalled();
});

test('password change rejects an overlong current password without ending the session',()=>{
  const changed=vi.fn();render(<ChangePasswordModal onClose={vi.fn()} onChanged={changed}/>);
  fireEvent.change(screen.getByLabelText('Mật khẩu hiện tại'),{target:{value:'🦊'.repeat(19)}});
  fireEvent.change(screen.getByLabelText('Mật khẩu mới',{exact:true}),{target:{value:'Replacement123!'}});
  fireEvent.change(screen.getByLabelText('Nhập lại mật khẩu mới'),{target:{value:'Replacement123!'}});
  fireEvent.submit(document.querySelector('form')!);
  expect(screen.getByRole('alert').textContent).toContain('rút ngắn');
  expect(api.password).not.toHaveBeenCalled();expect(changed).not.toHaveBeenCalled();
});
