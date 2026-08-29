import { describe, expect, it } from 'vitest';
import { protectedRedirect, publicRedirect } from '../lib/routeGuards';

describe('routeGuards', () => {
  it('sends unauthenticated users to /login from protected routes', () => {
    expect(protectedRedirect({ isAuthenticated: false })).toBe('/login');
  });

  it('renders protected routes for authenticated users', () => {
    expect(protectedRedirect({ isAuthenticated: true })).toBeNull();
  });

  it('sends authenticated users from public routes to /chat', () => {
    expect(publicRedirect({ isAuthenticated: true })).toBe('/chat');
  });

  it('renders public routes for unauthenticated users', () => {
    expect(publicRedirect({ isAuthenticated: false })).toBeNull();
  });
});
