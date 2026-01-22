export class Business {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public pesapalConsumerKey: string,
    public pesapalConsumerSecret: string,
  ) {}
}
