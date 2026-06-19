export function outcomeLabel(outcome: string) {
  switch (outcome) {
    case 'approved':
      return 'Approved';
    case 'flagged':
      return 'Flagged for Review';
    case 'blocked':
      return 'Blocked';
    default:
      return outcome;
  }
}

export function appealStatusLabel(status: string) {
  switch (status) {
    case 'pending':
      return 'Pending review';
    case 'accepted':
      return 'Accepted';
    case 'rejected':
      return 'Rejected';
    default:
      return status;
  }
}
