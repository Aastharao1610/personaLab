import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { CTA } from './components/CTA.jsx';
import { Features } from './components/Features.jsx';
import { Footer } from './components/Footer.jsx';
import { Header } from './components/Header.jsx';
import { Hero } from './components/Hero.jsx';
import { HowItWorks } from './components/HowItWorks.jsx';
import { SimulationWorkspace } from './components/simulation/SimulationWorkspace.jsx';
import { UploadScreen } from './components/upload/UploadScreen.jsx';

function App() {
  const [simulationSession, setSimulationSession] = useState(null);

  return (
    <AnimatePresence mode="wait">
      {simulationSession ? (
        <motion.div
          key="report"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
          className="min-h-screen bg-[#050505] text-white"
        >
          <SimulationWorkspace
            session={simulationSession}
            onRunAgain={() => setSimulationSession(null)}
          />
        </motion.div>
      ) : (
        <motion.div
          key="landing"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="min-h-screen overflow-hidden bg-[#050505] text-white"
        >
          <Header />
          <main>
            <Hero
              actionPanel={
                <UploadScreen
                  embedded
                  compact
                  onSimulationReady={setSimulationSession}
                />
              }
            />
            <Features />
            <HowItWorks />
            <CTA />
          </main>
          <Footer />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default App;
