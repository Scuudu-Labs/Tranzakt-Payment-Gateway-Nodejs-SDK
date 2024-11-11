import { COLLECTION_URL } from "../config";
import {
  GetCollectionInvoicesParams,
  GetCollectionInvoicesResponse,
  GetCollectionResponse,
} from "../types";
import { requestProcessor } from "../utils/request-processor";

export class CollectionService {
  constructor(private readonly secretKey: string) {}

  async getCollectionDetails(
    collectionId: string
  ): Promise<GetCollectionResponse> {
    return await requestProcessor<GetCollectionResponse>({
      url: `${COLLECTION_URL}/${collectionId}`,
      method: "GET",
      headers: { "x-api-key": this.secretKey },
    });
  }

  async getCollectionInvoices(
    collectionId: string,
    params?: GetCollectionInvoicesParams
  ): Promise<GetCollectionInvoicesResponse> {
    const queryParams = new URLSearchParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const url = `${COLLECTION_URL}/${collectionId}/Invoices${
      queryParams.toString() ? `?${queryParams.toString()}` : ""
    }`;

    return await requestProcessor<GetCollectionInvoicesResponse>({
      url,
      method: "GET",
      headers: { "x-api-key": this.secretKey },
    });
  }
}
