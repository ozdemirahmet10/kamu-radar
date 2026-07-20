export interface DomainEvent {
  readonly occurredAt: Date;
  readonly eventName: string;
}

export abstract class BaseDomainEvent implements DomainEvent {
  readonly occurredAt: Date = new Date();
  abstract readonly eventName: string;
}
