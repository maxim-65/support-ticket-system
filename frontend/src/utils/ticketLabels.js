export const statusLabels = {
  open: "Open",
  in_progress: "In Progress",
  closed: "Completed",
};

export const priorityLabels = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export function getStatusLabel(status) {
  return statusLabels[status] || status;
}

export function getPriorityLabel(priority) {
  return priorityLabels[priority] || priority;
}

export function getCommentRoleLabel(role) {
  return role === "agent" ? "Support Agent" : "Customer";
}
