import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createBrowserRouter, RouterProvider } from 'react-router';
import { CardEditorPage } from '../features/cards/CardEditorPage.tsx';
import { CardPage } from '../features/cards/CardPage.tsx';
import { GrimoireLayout } from '../features/campaigns/GrimoireLayout.tsx';
import { GrimoirePage } from '../features/campaigns/GrimoirePage.tsx';
import { HomePage } from '../features/campaigns/HomePage.tsx';
import { NotFoundPage } from './NotFoundPage.tsx';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
});

const router = createBrowserRouter([
  { path: '/', element: <HomePage /> },
  {
    path: '/c/:slug',
    element: <GrimoireLayout />,
    children: [
      { index: true, element: <GrimoirePage /> },
      { path: 'novo', element: <CardEditorPage /> },
      { path: 'e/:id', element: <CardPage /> },
      { path: 'e/:id/editar', element: <CardEditorPage /> },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]);

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
