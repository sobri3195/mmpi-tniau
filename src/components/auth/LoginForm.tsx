import { AdminLoginForm } from './AdminLoginForm';
export const LoginForm = ({ onSuccess }: { onSuccess: () => void }) => <AdminLoginForm onSuccess={() => onSuccess()} />;
