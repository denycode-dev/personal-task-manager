export const ROUTES = {
  home: "/",
  login: "/login",
  dashboard: "/dashboard",
  notes: {
    list: "/notes",
    new: "/notes/new",
    detail: (id: string) => `/notes/${id}`,
    edit: (id: string) => `/notes/${id}/edit`,
    public: (slug: string) => `/notes/public/${slug}`,
  },
  kanban: {
    list: "/kanban",
    board: (boardId: string) => `/kanban/${boardId}`,
  },
  checklists: {
    list: "/checklists",
    detail: (id: string) => `/checklists/${id}`,
  },
  calendar: "/calendar",
  folders: "/folders",
  offline: "/offline",
} as const;

export const PUBLIC_ROUTES: string[] = [
  ROUTES.login,
  ROUTES.offline,
];

export const API_ROUTES = {
  publicNote: (slug: string) => `/api/public/notes/${slug}`,
  upload: "/api/upload/imagekit",
} as const;