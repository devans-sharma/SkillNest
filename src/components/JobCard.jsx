function JobCard({ job }) {
  return (
    <div className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1">

      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={job.image}
          alt={job.title}
          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
        />

        {/* Price badge */}
        <span className="absolute top-3 right-3 bg-white/90 text-sm font-semibold px-3 py-1 rounded-full shadow">
          {job.price}
        </span>
      </div>

      {/* Content */}
      <div className="p-5">

        <h3 className="text-lg font-semibold mb-1">
          {job.title}
        </h3>

        <p className="text-sm text-muted-foreground mb-4">
          📍 {job.location}
        </p>

        <button className="w-full bg-primary text-white py-2.5 rounded-lg font-medium hover:opacity-90 transition">
          Accept Job
        </button>

      </div>

    </div>
  );
}

export default JobCard;