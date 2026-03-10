// Audit service stub for development
export const auditService = {
  async log(event: { action: string; [key: string]: any }) {
    if (process.env.NODE_ENV === "development") {
      console.log(`[audit] ${event.action}`, JSON.stringify(event));
    }
  },
};
