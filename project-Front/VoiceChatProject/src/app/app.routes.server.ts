import { RenderMode, ServerRoute } from '@angular/ssr';
import { Home } from './home/home';
export const serverRoutes: ServerRoute[] = [
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
