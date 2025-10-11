export default function HowItWorks() {
  const steps = [
    {
      icon: "💰",
      title: "1. Recibí tu Balance",
      description: "Todos arrancan con $10,000 dólares ficticios para apostar durante toda la temporada."
    },
    {
      icon: "🎯",
      title: "2. Hacé tus Apuestas",
      description: "Apostá a resultados H2H, puntos totales, diferencias y más. Antes de cada gameweek."
    },
    {
      icon: "🏆",
      title: "3. Ganá o Perdé",
      description: "Las apuestas se resuelven automáticamente al finalizar cada gameweek con los puntos reales."
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-transparent to-[#37003c]/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h3 className="text-3xl sm:text-4xl font-black text-white text-center mb-16">
          ¿Cómo funciona?
        </h3>
        
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, idx) => (
            <div 
              key={idx}
              className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-[#ff2882]/50 transition-colors"
            >
              <div className="w-14 h-14 rounded-xl gradient-fpl flex items-center justify-center text-2xl mb-4">
                {step.icon}
              </div>
              <h4 className="text-xl font-bold text-white mb-3">{step.title}</h4>
              <p className="text-gray-400">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}



