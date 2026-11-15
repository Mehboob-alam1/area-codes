declare module "directory-api" {
  interface DirectoryServer {
    address(): { port: number } | string | null;
    on(event: "error", listener: (error: Error) => void): void;
  }

  interface DirectoryApp {
    listen(port: number, host: string, callback: () => void): DirectoryServer;
  }

  export const app: DirectoryApp;
}
