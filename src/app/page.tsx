import { redirect } from 'next/navigation';

export default function Home() {
  // Redirect to login page for initial load
  redirect('/login');
}
