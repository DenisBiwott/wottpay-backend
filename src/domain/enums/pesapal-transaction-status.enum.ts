export enum PesapalTransactionStatus {
  PENDING = 0,
  COMPLETED = 1,
  FAILED = 2,
  REVERSED = 3,
}

export const PesapalTransactionStatusLabels: Record<
  PesapalTransactionStatus,
  string
> = {
  [PesapalTransactionStatus.PENDING]: 'PENDING',
  [PesapalTransactionStatus.COMPLETED]: 'COMPLETED',
  [PesapalTransactionStatus.FAILED]: 'FAILED',
  [PesapalTransactionStatus.REVERSED]: 'REVERSED',
};
