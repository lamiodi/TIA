import { useState, useEffect } from "react";
import axios from "axios";
import { Pencil, Trash2, PlusCircle } from "lucide-react";

export default function AdminDiscounts() {
  const [discounts, setDiscounts] = useState([]);
  const [form, setForm] = useState({
    code: "",
    type: "percentage", // percentage | fixed
    value: "",
    active: true,
  });
  const [editingId, setEditingId] = useState(null);

  // Fetch discounts from backend
  useEffect(() => {
    fetchDiscounts();
  }, []);

  const fetchDiscounts = async () => {
    try {
      const res = await axios.get("/api/discounts");
      setDiscounts(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`/api/discounts/${editingId}`, form);
      } else {
        await axios.post("/api/discounts", form);
      }
      setForm({ code: "", type: "percentage", value: "", active: true });
      setEditingId(null);
      fetchDiscounts();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (discount) => {
    setForm({
      code: discount.code,
      type: discount.type,
      value: discount.value,
      active: discount.active,
    });
    setEditingId(discount.id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this discount?")) return;
    try {
      await axios.delete(`/api/discounts/${id}`);
      fetchDiscounts();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">
        {editingId ? "Edit Discount" : "Create Discount"}
      </h2>

      {/* Discount Form */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <input
          type="text"
          placeholder="Discount Code"
          value={form.code}
          onChange={(e) => setForm({ ...form, code: e.target.value })}
          className="border p-2 rounded"
          required
        />
        <select
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value })}
          className="border p-2 rounded"
        >
          <option value="percentage">Percentage (%)</option>
          <option value="fixed">Fixed Amount</option>
        </select>
        <input
          type="number"
          placeholder="Value"
          value={form.value}
          onChange={(e) => setForm({ ...form, value: e.target.value })}
          className="border p-2 rounded"
          required
        />
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => setForm({ ...form, active: e.target.checked })}
            className="mr-2"
          />
          <span>Active</span>
        </div>

        <button
          type="submit"
          className="col-span-1 md:col-span-4 bg-blue-600 text-white py-2 px-4 rounded flex items-center justify-center"
        >
          <PlusCircle className="w-5 h-5 mr-2" />
          {editingId ? "Update Discount" : "Add Discount"}
        </button>
      </form>

      {/* Discount List */}
      <h3 className="text-xl font-semibold mb-2">Existing Discounts</h3>
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="p-2 border">Code</th>
            <th className="p-2 border">Type</th>
            <th className="p-2 border">Value</th>
            <th className="p-2 border">Active</th>
            <th className="p-2 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {discounts.length === 0 ? (
            <tr>
              <td colSpan="5" className="text-center p-4">
                No discounts found
              </td>
            </tr>
          ) : (
            discounts.map((d) => (
              <tr key={d.id} className="border-t">
                <td className="p-2 border">{d.code}</td>
                <td className="p-2 border capitalize">{d.type}</td>
                <td className="p-2 border">{d.value}</td>
                <td className="p-2 border">{d.active ? "Yes" : "No"}</td>
                <td className="p-2 border flex gap-2">
                  <button
                    onClick={() => handleEdit(d)}
                    className="bg-yellow-400 text-white px-2 py-1 rounded flex items-center"
                  >
                    <Pencil className="w-4 h-4 mr-1" /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(d.id)}
                    className="bg-red-500 text-white px-2 py-1 rounded flex items-center"
                  >
                    <Trash2 className="w-4 h-4 mr-1" /> Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
