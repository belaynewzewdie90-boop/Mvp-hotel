import { Link } from "react-router-dom";
import Icon from "./Icon";

const LINKS = [
  { to: "/admin", label: "Dashboard", icon: "dashboard" },
  { to: "/kitchen", label: "Kitchen", icon: "chefHat" },
  { to: "/store", label: "Store", icon: "box" },
  { to: "/", label: "Customer Menu", icon: "menu" },
];

export default function Sidebar({ active, title = "Admin Panel", icon = "lock" }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-mark">
          <Icon name={icon} />
        </div>
        <div>
          <h1>Grand Plaza</h1>
          <small>{title}</small>
        </div>
      </div>
      <nav>
        {LINKS.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className={link.to === active ? "active" : ""}
          >
            <Icon name={link.icon} />
            {link.label}
          </Link>
        ))}
      </nav>
      <div className="sidebar-foot">
        <Link className="btn btn-ghost" to="/">
          ← Back to site
        </Link>
      </div>
    </aside>
  );
}
