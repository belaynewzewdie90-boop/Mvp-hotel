import Icon from "./Icon";

export default function EmptyState({ icon = "menu", message }) {
  return (
    <div className="empty-state">
      <Icon name={icon} />
      <p>{message}</p>
    </div>
  );
}
