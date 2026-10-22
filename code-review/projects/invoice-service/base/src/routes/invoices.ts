import type { FastifyInstance } from "fastify";
import { conflict } from "../lib/errors";
import {
  type AddLineRoute,
  addLineSchema,
  type CreateInvoiceRoute,
  createInvoiceSchema,
  type InvoiceByIdRoute,
  type InvoiceStatus,
  invoiceByIdSchema,
  type ListInvoicesRoute,
  listInvoicesSchema,
  type PayInvoiceRoute,
  payInvoiceSchema,
  type RemoveLineRoute,
  removeLineSchema,
} from "../schemas";
import type { InvoiceService } from "../services/invoices";

export function invoiceRoutes(
  app: FastifyInstance,
  service: InvoiceService,
): void {
  /** Loads the invoice and rejects the request unless it is in `allowed`. */
  const requireStatus = (
    id: string,
    allowed: readonly InvoiceStatus[],
    action: string,
  ): void => {
    const { status } = service.get(id);
    if (!allowed.includes(status)) {
      throw conflict(`cannot ${action} an invoice that is ${status}`);
    }
  };

  app.post<CreateInvoiceRoute>(
    "/invoices",
    { schema: createInvoiceSchema },
    async (request, reply) => {
      const invoice = service.create(request.body);
      return reply.code(201).send(invoice);
    },
  );

  app.get<ListInvoicesRoute>(
    "/invoices",
    { schema: listInvoicesSchema },
    async (request) => service.list(request.query),
  );

  app.get<InvoiceByIdRoute>(
    "/invoices/:id",
    { schema: invoiceByIdSchema },
    async (request) => service.get(request.params.id),
  );

  app.post<AddLineRoute>(
    "/invoices/:id/lines",
    { schema: addLineSchema },
    async (request) => {
      requireStatus(request.params.id, ["draft"], "edit lines on");
      return service.addLine(request.params.id, request.body);
    },
  );

  app.delete<RemoveLineRoute>(
    "/invoices/:id/lines/:lineId",
    { schema: removeLineSchema },
    async (request) => {
      const { id, lineId } = request.params;
      requireStatus(id, ["draft"], "edit lines on");
      return service.removeLine(id, lineId);
    },
  );

  app.post<InvoiceByIdRoute>(
    "/invoices/:id/issue",
    { schema: invoiceByIdSchema },
    async (request) => {
      requireStatus(request.params.id, ["draft"], "issue");
      return service.issue(request.params.id);
    },
  );

  app.post<PayInvoiceRoute>(
    "/invoices/:id/pay",
    { schema: payInvoiceSchema },
    async (request) => {
      requireStatus(request.params.id, ["issued"], "pay");
      return service.pay(request.params.id, request.body.method);
    },
  );

  app.post<InvoiceByIdRoute>(
    "/invoices/:id/void",
    { schema: invoiceByIdSchema },
    async (request) => {
      requireStatus(request.params.id, ["draft", "issued"], "void");
      return service.void(request.params.id);
    },
  );
}
