import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.replaceState(null, '', '/');
  });

  it('merender aplikasi tanpa crash dan menampilkan navigasi utama', async () => {
    render(<App />);

    expect(screen.getByText('MMPI TNI AU')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /mulai tes/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /admin/i })).toBeInTheDocument();
  });
});
