interface CTASectionProps {
  title?: string;
  description?: string;
  buttonText?: string;
}

export default function CTASection({ 
  title = "¿Listo para dominar la liga?",
  description = "Unite a la competencia más picante de Fantasy Premier League",
  buttonText = "Empezar Ahora"
}: CTASectionProps) {
  return (
    <section className="py-32">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h3 className="text-4xl sm:text-5xl font-black text-white mb-6">
          {title}
        </h3>
        <p className="text-xl text-gray-400 mb-10">
          {description}
        </p>
        <button className="px-12 py-5 rounded-full gradient-fpl text-white font-bold text-xl hover:scale-105 transition-transform shadow-2xl shadow-[#ff2882]/30">
          {buttonText}
        </button>
      </div>
    </section>
  );
}



