
import { useEffect, useState } from "react";
import {
    ArrowUpRight,
    ClipboardList,
    Clock3,
    LogOut,
    RefreshCw,
    Search,
    ShieldCheck,
    Sun,
    Zap,
} from "lucide-react";

import {
    api,
    getErrorMessage,
    type Order,
    type StaffUser,
} from "../services/api";

type Props = {
    user: StaffUser;
    onLogout: () => void;
};

const STATUS_OPTIONS = [
    "Scheduled",
    "In Progress",
    "Completed",
    "Cancelled",
] as const;

function formatDate(value: string) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "—";
    }

    return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

function getStatusClass(status: string) {
    switch (status.toLowerCase()) {
        case "completed":
            return "completed";
        case "in progress":
            return "in-progress";
        case "scheduled":
            return "scheduled";
        case "cancelled":
            return "cancelled";
        default:
            return "unknown";
    }
}

export default function OrdersDashboard({
    user,
    onLogout,
}: Props) {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");

    const [updatingOrderId, setUpdatingOrderId] = useState<
        number | null
    >(null);

    // Fetch orders from the backend.
    useEffect(() => {
        let active = true;

        async function fetchOrders() {
            try {
                const { data } = await api.get<Order[]>("/orders");

                if (active) {
                    setOrders(data);
                }
            } catch (err) {
                if (!active) return;

                setError(getErrorMessage(err));

                const status = (
                    err as { response?: { status?: number } }
                )?.response?.status;

                if (status === 401 || status === 403) {
                    onLogout();
                }
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        }

        void fetchOrders();

        return () => {
            active = false;
        };
    }, [onLogout]);

    // Refresh orders manually.
    async function loadOrders() {
        setLoading(true);
        setError("");

        try {
            const { data } = await api.get<Order[]>("/orders");
            setOrders(data);
        } catch (err) {
            setError(getErrorMessage(err));

            const status = (
                err as { response?: { status?: number } }
            )?.response?.status;

            if (status === 401 || status === 403) {
                onLogout();
            }
        } finally {
            setLoading(false);
        }
    }

    // Task 2: Update an order and refresh its status in React.
    async function updateOrderStatus(
        orderId: number,
        newStatus: string
    ) {
        if (!newStatus.trim()) {
            setError("Please select a valid status.");
            return;
        }

        const currentOrder = orders.find(
            (order) => order.id === orderId
        );

        if (!currentOrder) {
            setError("Order not found.");
            return;
        }

        if (currentOrder.status === newStatus) {
            return;
        }

        setUpdatingOrderId(orderId);
        setError("");

        try {
            const { data } = await api.patch<{
                message: string;
                order: Order;
            }>(
                `/orders/${orderId}/status`,
                { status: newStatus }
            );

            // Update the UI without reloading the page.
            setOrders((previousOrders) =>
                previousOrders.map((order) =>
                    order.id === orderId
                        ? {
                            ...order,
                            status: data.order.status,
                        }
                        : order
                )
            );
        } catch (err) {
            setError(getErrorMessage(err));

            const status = (
                err as { response?: { status?: number } }
            )?.response?.status;

            if (status === 401 || status === 403) {
                onLogout();
            }
        } finally {
            setUpdatingOrderId(null);
        }
    }

    const activeOrders = orders.filter(
        (order) =>
            order.status !== "Completed" &&
            order.status !== "Cancelled"
    ).length;

    const inProgress = orders.filter(
        (order) => order.status === "In Progress"
    ).length;

    const filteredOrders = orders.filter((order) => {
        const text = `
      ${order.id}
      ${order.customer_name}
      ${order.address}
      ${order.status}
    `;

        return text.toLowerCase().includes(search.toLowerCase());
    });

    return (
        <div className="dashboard-layout">
            <aside className="sidebar">
                <div className="brand">
                    <span className="brand-icon">
                        <Sun size={23} />
                    </span>

                    <span>
                        sungrid
                        <span className="brand-accent">solar.</span>
                    </span>
                </div>

                <span className="nav-label">WORKSPACE</span>

                <nav
                    className="sidebar-nav"
                    aria-label="Main navigation"
                >
                    <div className="nav-item active">
                        <ClipboardList size={19} />
                        Installation Orders
                    </div>
                </nav>

                <div className="sidebar-bottom">
                    <div className="secure-note">
                        <ShieldCheck size={20} />

                        <div>
                            <strong>Secure Workspace</strong>
                            <span>Staff access verified</span>
                        </div>
                    </div>

                    <button
                        onClick={onLogout}
                        className="logout-button"
                    >
                        <LogOut size={18} />
                        Sign out
                    </button>
                </div>
            </aside>

            <main className="dashboard-main">
                <header className="topbar">
                    <span className="breadcrumb">
                        Workspace <span>/</span> Installation Orders
                    </span>

                    <div className="user-chip">
                        <span className="user-avatar">
                            {user.name.charAt(0).toUpperCase()}
                        </span>

                        <div>
                            <strong>{user.name}</strong>
                            <small>Staff member</small>
                        </div>
                    </div>
                </header>

                <div className="dashboard-content">
                    <div className="page-heading">
                        <div>
                            <span className="section-label">
                                OPERATIONS OVERVIEW
                            </span>

                            <h1>Installation orders</h1>

                            <p>
                                Track solar installation jobs across your team.
                            </p>
                        </div>

                        <button
                            className="refresh-button"
                            onClick={() => void loadOrders()}
                            disabled={loading || updatingOrderId !== null}
                        >
                            <RefreshCw size={17} />
                            Refresh
                        </button>
                    </div>

                    <div className="stats-grid">
                        <article className="stat-card">
                            <div className="stat-heading">
                                <span>Total orders</span>
                                <ClipboardList size={20} />
                            </div>

                            <strong>{orders.length}</strong>
                            <small>All installation records</small>
                        </article>

                        <article className="stat-card">
                            <div className="stat-heading">
                                <span>Active orders</span>
                                <Zap size={20} />
                            </div>

                            <strong>{activeOrders}</strong>
                            <small>Awaiting completion</small>
                        </article>

                        <article className="stat-card">
                            <div className="stat-heading">
                                <span>In progress</span>
                                <Clock3 size={20} />
                            </div>

                            <strong>{inProgress}</strong>
                            <small>Installations underway</small>
                        </article>
                    </div>

                    <section className="orders-panel">
                        <div className="panel-heading">
                            <div>
                                <h2>All installation orders</h2>

                                <p>
                                    Live records from the SunGrid database
                                </p>
                            </div>

                            <ArrowUpRight size={20} />
                        </div>

                        <div className="table-toolbar">
                            <div className="search-box">
                                <Search size={18} />

                                <input
                                    type="search"
                                    placeholder="Search orders..."
                                    aria-label="Search orders"
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                />
                            </div>

                            <span className="result-count">
                                {filteredOrders.length} records
                            </span>
                        </div>

                        {error && (
                            <p
                                className="error-message"
                                role="alert"
                                style={{ margin: "15px 25px" }}
                            >
                                {error}
                            </p>
                        )}

                        {loading ? (
                            <div className="table-state">
                                Loading orders...
                            </div>
                        ) : filteredOrders.length === 0 ? (
                            <div className="table-state">
                                <ClipboardList size={32} />

                                <h3>No orders found</h3>

                                <p>
                                    {orders.length === 0
                                        ? "There are no installation orders in the database yet."
                                        : "Try a different search term."}
                                </p>
                            </div>
                        ) : (
                            <div className="table-scroll">
                                <table className="orders-table">
                                    <thead>
                                        <tr>
                                            <th>Order ID</th>
                                            <th>Customer</th>
                                            <th>Installation address</th>
                                            <th>Status</th>
                                            <th>Created</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {filteredOrders.map((order) => (
                                            <tr key={order.id}>
                                                <td className="order-id">
                                                    #{String(order.id).padStart(4, "0")}
                                                </td>

                                                <td className="customer-name">
                                                    {order.customer_name}
                                                </td>

                                                <td>{order.address}</td>

                                                <td>
                                                    <div className="status-editor">
                                                        <span
                                                            className={`status ${getStatusClass(
                                                                order.status
                                                            )}`}
                                                        >
                                                            <span className="status-dot" />
                                                            {order.status}
                                                        </span>

                                                        <select
                                                            className="status-select"
                                                            aria-label={`Change status for order ${order.id}`}
                                                            value={order.status}
                                                            disabled={updatingOrderId !== null}
                                                            onChange={(event) =>
                                                                void updateOrderStatus(
                                                                    order.id,
                                                                    event.target.value
                                                                )
                                                            }
                                                        >
                                                            {STATUS_OPTIONS.map((status) => (
                                                                <option
                                                                    key={status}
                                                                    value={status}
                                                                >
                                                                    {status}
                                                                </option>
                                                            ))}
                                                        </select>

                                                        {updatingOrderId === order.id && (
                                                            <span className="saving-indicator">
                                                                Saving...
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>

                                                <td>
                                                    {formatDate(order.created_at)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>

                    <p className="dashboard-footer">
                        SunGrid Solar · Internal operations portal ·
                        Staff order management
                    </p>
                </div>
            </main>
        </div>
    );
}
