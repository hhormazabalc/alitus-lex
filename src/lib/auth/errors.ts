'use strict';

export class AuthError extends Error {
  constructor(
    message: string,
    public code:
      | 'NO_SESSION'
      | 'ACCOUNT_PENDING'
      | 'NO_ORGANIZATION'
      | 'ORG_ACCESS_DENIED'
      | 'NO_ACTIVE_MEMBERSHIP',
  ) {
    super(message);
  }
}

export class AuthMissingError extends AuthError {
  constructor() {
    super('No autenticado', 'NO_SESSION');
  }
}

export class PendingAccountError<TProfile = unknown> extends AuthError {
  constructor(public profile: TProfile) {
    super('Cuenta pendiente de activación', 'ACCOUNT_PENDING');
  }
}

export class OrganizationSelectionError<TMembership = unknown> extends AuthError {
  constructor(public memberships: TMembership[]) {
    super('Selecciona una organización para continuar', 'NO_ORGANIZATION');
  }
}

export class OrganizationAccessDeniedError extends AuthError {
  constructor(public orgId: string | null) {
    super('Acceso denegado a la organización solicitada', 'ORG_ACCESS_DENIED');
  }
}
