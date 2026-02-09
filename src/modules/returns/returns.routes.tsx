import { RouteObject } from 'react-router-dom';
import Returns from './pages/Returns';
import CreateReturn from './pages/CreateReturn';
import EditReturn from './pages/EditReturn';

export const returnsRoutes: RouteObject[] = [
    { path: 'returns', element: <Returns /> },
    { path: 'returns/add', element: <CreateReturn /> },
    { path: 'returns/edit/:id', element: <EditReturn /> },
];
