import {
  ApiError,
  ClientRequestStatus,
  Collection,
  CollectionStatus,
  GetCollectionInvoicesResponse,
  InvoiceExpirationPeriod,
  InvoiceStatus,
  InvoiceType,
  PaymentChannelType,
  ServiceFeeBilling,
  SettlementFrequency,
  Tranzakt,
} from "../src";
import { BASE_URL, COLLECTION_URL } from "../src/config";

describe("CollectionService", () => {
  const mockSecretKey = "test-secret-key";
  const tranzakt = new Tranzakt(mockSecretKey);

  const mockCollectionResponse: Collection = {
    id: "col-001",
    collectionName: "Test Collection",
    description: "Test Collection Description",
    invoiceExpirationPeriod: InvoiceExpirationPeriod.TwentyFour_Hours,
    paymentChannels: [PaymentChannelType.Card, PaymentChannelType.BankTransfer],
    settlementFrequency: SettlementFrequency.Instant,
    serviceFeeBilling: ServiceFeeBilling.Payer,
    amount: 1000,
    dateCreated: "2024-01-01T00:00:00Z",
    status: CollectionStatus.Active,
    collectionAccounts: [
      {
        percentage: 100,
        linkedAccount: {
          id: "acc-001",
          accountName: "Test Account",
          accountNumber: "1234567890",
          bank: {
            id: "bank-001",
            name: "Test Bank",
            code: "001",
            logo: "https://example.com/logo.png",
          },
          merchant: {
            merchantId: "merch-001",
            businessName: "Test Business",
          },
        },
      },
    ],
    collectionClient: {
      clientId: "client-001",
      clientName: "Test Client",
      status: ClientRequestStatus.Approved,
    },
  };

  const mockCollectionInvoicesResponse: GetCollectionInvoicesResponse = {
    items: [
      {
        id: "inv-001",
        title: "Test Invoice",
        amount: 1000,
        status: InvoiceStatus.Unpaid,
        payerName: "John Doe",
        payerEmail: "john@example.com",
        dateCreated: "2024-01-01T00:00:00Z",
        datePaid: undefined,
      },
    ],
    page: 1,
    pageSize: 10,
    totalCount: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getCollectionDetails", () => {
    it("should fetch collection details successfully", async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockCollectionResponse),
        } as Response)
      ) as jest.Mock;

      const response = await tranzakt.getCollection("col-001");

      expect(response).toEqual(mockCollectionResponse);
      expect(fetch).toHaveBeenCalledWith(
        `${BASE_URL}${COLLECTION_URL}/col-001`,
        expect.objectContaining({
          headers: {
            Authorization: `Bearer ${mockSecretKey}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          method: "GET",
        })
      );
    });

    it("should handle collection not found error", async () => {
      const mockError: ApiError = {
        status: 404,
        message: "Collection not found",
        type: "NotFound",
        errors: ["Collection not found"],
      };

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          status: 404,
          json: () => Promise.resolve(mockError),
        } as Response)
      ) as jest.Mock;

      await expect(tranzakt.getCollection("invalid-id")).rejects.toEqual(
        mockError
      );
    });
  });

  describe("getCollectionInvoices", () => {
    it("should fetch collection invoices without parameters", async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockCollectionInvoicesResponse),
        } as Response)
      ) as jest.Mock;

      const response = await tranzakt.getCollectionInvoices("col-001");

      expect(response).toEqual(mockCollectionInvoicesResponse);
      expect(fetch).toHaveBeenCalledWith(
        `${BASE_URL}${COLLECTION_URL}/col-001/Invoices`,
        expect.objectContaining({
          headers: {
            Authorization: `Bearer ${mockSecretKey}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          method: "GET",
        })
      );
    });

    it("should fetch collection invoices with all possible parameters", async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockCollectionInvoicesResponse),
        } as Response)
      ) as jest.Mock;

      const params = {
        invoiceStatus: InvoiceStatus.Unpaid,
        search: "test",
        startDate: "2024-01-01",
        endDate: "2024-01-31",
        InvoiceType: InvoiceType.Live,
        linkedAccountId: "acc-001",
        IsDownloading: true,
        page: 2,
        pageSize: 20,
      };

      await tranzakt.getCollectionInvoices("col-001", params);

      const expectedUrl = `${BASE_URL}${COLLECTION_URL}/col-001/Invoices?invoiceStatus=Unpaid&search=test&startDate=2024-01-01&endDate=2024-01-31&InvoiceType=Live&linkedAccountId=acc-001&IsDownloading=true&page=2&pageSize=20`;

      expect(fetch).toHaveBeenCalledWith(expectedUrl, expect.any(Object));
    });

    it("should handle unauthorized access error", async () => {
      const mockError: ApiError = {
        status: 401,
        message: "Unauthorized access",
        type: "Unauthorized",
        errors: ["Invalid or expired token"],
      };

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          status: 401,
          json: () => Promise.resolve(mockError),
        } as Response)
      ) as jest.Mock;

      await expect(tranzakt.getCollectionInvoices("col-001")).rejects.toEqual(
        mockError
      );
    });

    it("should handle malformed date parameters", async () => {
      const mockError: ApiError = {
        status: 400,
        message: "Invalid date format",
        type: "ValidationError",
        errors: ["startDate must be in YYYY-MM-DD format"],
      };

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          status: 400,
          json: () => Promise.resolve(mockError),
        } as Response)
      ) as jest.Mock;

      await expect(
        tranzakt.getCollectionInvoices("col-001", {
          startDate: "invalid-date",
        })
      ).rejects.toEqual(mockError);
    });
  });
});