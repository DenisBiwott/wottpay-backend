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

export interface IPesapalProvider {
  getAccessToken(
    consumerKey: string,
    consumerSecret: string,
  ): Promise<PesapalAuthResponse>;

  registerIpn(
    token: string,
    request: PesapalRegisterIpnRequest,
  ): Promise<PesapalRegisterIpnResponse>;

  getRegisteredIpns(token: string): Promise<PesapalIpnListItem[]>;

  submitOrder(
    token: string,
    request: PesapalSubmitOrderRequest,
  ): Promise<PesapalSubmitOrderResponse>;

  getTransactionStatus(
    token: string,
    orderTrackingId: string,
  ): Promise<PesapalTransactionStatusResponse>;

  cancelOrder(
    token: string,
    orderTrackingId: string,
  ): Promise<PesapalCancelOrderResponse>;
}
