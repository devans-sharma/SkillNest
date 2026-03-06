function ServiceCard({ service }) {
  return (
    <div className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1">

      <div className="relative h-48 overflow-hidden">
        <img
          src={service.image}
          alt={service.title}
          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
        />

        <span className="absolute top-3 right-3 bg-white/90 px-3 py-1 rounded-full text-sm font-semibold">
          {service.price}
        </span>
      </div>

      <div className="p-5">

        <h3 className="text-lg font-semibold">
          {service.title}
        </h3>

        <p className="text-sm text-muted-foreground">
          by {service.provider}
        </p>

        <p className="text-sm mt-2">
          ⭐ {service.rating}
        </p>

        <button className="mt-4 w-full bg-primary text-white py-2.5 rounded-lg font-medium hover:opacity-90">
          View Details
        </button>

      </div>

    </div>
  );
}

export default ServiceCard;