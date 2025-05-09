// Angular Modules
import { Injectable } from "@angular/core";
// Application Classes
import { UrlBuilder } from "../../shared/classes/url-builder";
import { QueryStringParameters } from "../../shared/classes/query-string-parameters";
// Application Constants
import { Constants } from "src/app/config/constants";
@Injectable({
  providedIn: "root",
})
export class ApiEndpointsService {
  constructor(
    // Application Constants
    private readonly constants: Constants
  ) {}
  /* #region URL CREATOR */
  // URL
  public createUrl(action: string, isMockAPI: boolean = false): string {
    const urlBuilder: UrlBuilder = new UrlBuilder(
      isMockAPI
        ? this.constants.GATEWAY_API_MOCK_ENDPOINT
        : this.constants.GATEWAY_API_ENDPOINT,
      action
    );
    return urlBuilder.toString();
  }
  // URL WITH QUERY PARAMS
  public createUrlWithQueryParameters(
    action: string,
    queryStringHandler?: (queryStringParameters: QueryStringParameters) => void
  ): string {
    const urlBuilder: UrlBuilder = new UrlBuilder(
      this.constants.GATEWAY_API_ENDPOINT,
      action
    );
    // Push extra query string params
    if (queryStringHandler) {
      queryStringHandler(urlBuilder.queryString);
    }
    return urlBuilder.toString();
  }

  // URL WITH PATH VARIABLES
  public createUrlWithPathVariables(
    action: string,
    pathVariables: any[] = []
  ): string {
    let encodedPathVariablesUrl: string = "";
    // Push extra path variables
    for (const pathVariable of pathVariables) {
      if (pathVariable !== null) {
        encodedPathVariablesUrl += `/${encodeURIComponent(
          pathVariable.toString()
        )}`;
      }
    }
    const urlBuilder: UrlBuilder = new UrlBuilder(
      this.constants.GATEWAY_API_ENDPOINT,
      `${action}${encodedPathVariablesUrl}`
    );
    return urlBuilder.toString();
  }
  /* #endregion */
}
