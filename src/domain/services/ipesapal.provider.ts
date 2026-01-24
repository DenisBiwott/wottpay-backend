export interface PesapalAuthResponse {
  token: string;
  expiryDate: string;
  error?: {
    error_type: string;
    code: string;
    message: string;
  };
  status: string;
  message: string;
}

export interface PesapalRegisterIpnRequest {
  url: string;
  ipn_notification_type: 'GET' | 'POST';
}

export interface PesapalRegisterIpnResponse {
  url: string;
  created_date: string;
  ipn_id: string;
  error?: {
    error_type: string;
    code: string;
    message: string;
  };
  status: string;
}

export interface PesapalIpnListItem {
  url: string;
  created_date: string;
  ipn_id: string;
  notification_type: 'GET' | 'POST';
  ipn_notification_type_description: string;
  ipn_status: number;
  ipn_status_description: string;
}

export interface PesapalBillingAddress {
  email_address?: string;
  phone_number?: string;
  country_code?: string;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  line_1?: string;
  line_2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  zip_code?: string;
}

export interface PesapalSubscriptionDetails {
  start_date: string;
  end_date: string;
  frequency: string;
}

export interface PesapalSubmitOrderRequest {
  id: string;
  currency: string;
  amount: number;
  description: string;
  callback_url: string;
  notification_id: string;
  billing_address: PesapalBillingAddress;
  redirect_mode?: string;
  cancellation_url?: string;
  subscription_details?: PesapalSubscriptionDetails;
  account_number?: string;
  branch?: string;
}

export interface PesapalSubmitOrderResponse {
  order_tracking_id: string;
  merchant_reference: string;
  redirect_url: string;
  error?: {
    error_type: string;
    code: string;
    message: string;
  };
  status: string;
}

export interface PesapalTransactionStatusResponse {
  payment_method: string;
  amount: number;
  created_date: string;
  confirmation_code: string;
  order_tracking_id: string;
  payment_status_description: string;
  description: string;
  message: string;
  payment_account: string;
  call_back_url: string;
  status_code: number;
  merchant_reference: string;
  account_number: string;
  payment_status_code: string;
  currency: string;
  error?: {
    error_type: string;
    code: string;
    message: string;
  };
  status: string;
}

export interface PesapalCancelOrderResponse {
  order_tracking_id: string;
  status: string;
  message: string;
  error?: {
    error_type: string;
    code: string;
    message: string;
  };
}

/**
 * PesaPal payment provider interface.
 * Defines the contract for interacting with PesaPal's payment gateway API.
 * Implementations should handle HTTP communication and error responses.
 */
export interface IPesapalProvider {
  /**
   * Authenticate with PesaPal to obtain an access token.
   * Tokens are typically valid for a limited time and should be cached.
   * @param consumerKey - PesaPal merchant consumer key
   * @param consumerSecret - PesaPal merchant consumer secret
   * @returns Authentication response containing token and expiry
   */
  getAccessToken(
    consumerKey: string,
    consumerSecret: string,
  ): Promise<PesapalAuthResponse>;

  /**
   * Register an IPN (Instant Payment Notification) endpoint with PesaPal.
   * PesaPal will send payment status updates to this URL.
   * @param token - Valid access token
   * @param request - IPN registration details (URL and notification type)
   * @returns Registration response with assigned IPN ID
   */
  registerIpn(
    token: string,
    request: PesapalRegisterIpnRequest,
  ): Promise<PesapalRegisterIpnResponse>;

  /**
   * Retrieve all registered IPN endpoints for the merchant.
   * @param token - Valid access token
   * @returns List of registered IPN endpoints
   */
  getRegisteredIpns(token: string): Promise<PesapalIpnListItem[]>;

  /**
   * Submit a new payment order to PesaPal.
   * Creates a payment request and returns a redirect URL for the customer.
   * @param token - Valid access token
   * @param request - Order details including amount, currency, and billing info
   * @returns Order response with tracking ID and redirect URL
   */
  submitOrder(
    token: string,
    request: PesapalSubmitOrderRequest,
  ): Promise<PesapalSubmitOrderResponse>;

  /**
   * Query the current status of a transaction.
   * Use this to verify payment completion or check for failures.
   * @param token - Valid access token
   * @param orderTrackingId - PesaPal order tracking ID
   * @returns Transaction status including payment method and confirmation code
   */
  getTransactionStatus(
    token: string,
    orderTrackingId: string,
  ): Promise<PesapalTransactionStatusResponse>;

  /**
   * Cancel a pending payment order.
   * Only pending orders can be cancelled; completed orders require refunds.
   * @param token - Valid access token
   * @param orderTrackingId - PesaPal order tracking ID to cancel
   * @returns Cancellation response with status
   */
  cancelOrder(
    token: string,
    orderTrackingId: string,
  ): Promise<PesapalCancelOrderResponse>;
}
