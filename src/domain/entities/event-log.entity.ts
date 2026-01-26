export class EventLog {
  constructor(
    public id: string,
    public action: string,
    public userId: string,
    public businessId: string,
    public resourceType: string,
    public resourceId: string,
    public metadata: Record<string, any>,
    public createdAt: Date,
  ) {}
}
