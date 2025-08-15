import { useState } from 'react';
import toast from 'react-hot-toast';

function ContactWhatsAppWidget() {
  const [formData, setFormData] = useState({ name: '', message: '' });
  const phoneNumber = '2348104117122'; // Replace with your WhatsApp number

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.name || !formData.message) {
      toast.error('Please fill in all fields.');
      return;
    }

    const whatsappMessage = `Message from ${formData.name}: ${formData.message}`;
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(whatsappMessage)}`;

    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    toast.success('Opening WhatsApp...');
    setFormData({ name: '', message: '' });
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md space-y-6">
        <h2 className="text-2xl font-bold text-center">Chat with Us on WhatsApp</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Name</label>
            <input
              type="text"
              placeholder="Your Name"
              className="w-full border px-4 py-3 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Message</label>
            <textarea
              placeholder="Your Message"
              className="w-full border px-4 py-3 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              required
              rows="5"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-green-500 text-white py-3 rounded-xl hover:bg-green-600 transition flex items-center justify-center"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.174.198-.347.223-.644.075-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.019-.458.13-.606.134-.133.297-.347.446-.52.148-.174.198-.298.297-.497.099-.198.05-.371-.025-.52-.074-.149-.669-.719-.911-.99-.242-.272-.487-.247-.669-.247-.173 0-.421.074-.645.223-.297.198-1.14.645-1.14 1.568s1.163 1.818 1.337 1.916c.173.099 2.39 3.637 5.807 5.104.595.248 1.058.396 1.405.471.446.099.868.05 1.262-.099.396-.148 1.262-.595 1.436-.793.173-.198.173-.347.025-.521-.149-.173-.669-.421-.966-.57zM12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 22.957c-6.075 0-11-4.925-11-11S5.925 1 12 1s11 4.925 11 11-4.925 11-11 11z" />
            </svg>
            Send via WhatsApp
          </button>
        </form>
      </div>
    </div>
  );
}

export default ContactWhatsAppWidget;