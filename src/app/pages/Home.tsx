import { Link } from 'react-router';
import { Lock, Unlock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { motion } from 'framer-motion';
import CamouFileLogo from '../../assets/camoufile.png';

export default function Home() {
  // Animation variants - removed pulsing/flashing effects
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
        duration: 0.5
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };

  const cardVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5, ease: "easeOut" }
    },
    hover: {
      y: -5,
      transition: { duration: 0.2, ease: "easeOut" }
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
      {/* Background Image - removed scale animation */}
      <motion.div 
        className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('/GreenBG.jpg')`,
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/50"></div>
      </motion.div>
      
      <motion.div 
        className="relative z-10 max-w-6xl w-full"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="text-center mb-12" variants={itemVariants}>
          <motion.div 
            className="inline-flex items-center justify-center w-28 h-28 mb-6"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <img 
              src={CamouFileLogo} 
              alt="CamouFile Logo" 
              className="w-full h-full object-contain drop-shadow-lg"
            />
          </motion.div>
          <motion.p 
            className="text-xl text-white max-w-2xl mx-auto drop-shadow-md"
            variants={itemVariants}
          >
            Secure steganography tool combining LSB embedding with ChaCha20 encryption.
            Hide sensitive messages inside images with cryptographic tamper detection.
          </motion.p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Encode Card */}
          <motion.div variants={cardVariants} whileHover="hover">
            <Card className="bg-stone-800/70 border-stone-600/40 shadow-2xl shadow-black/30 hover:border-lime-500/60 hover:shadow-lime-500/20 transition-all duration-300 backdrop-blur-sm flex flex-col h-full">
              <CardHeader className="flex-1">
                <motion.div 
                  className="w-14 h-14 bg-gradient-to-br from-lime-500 to-yellow-500 rounded-xl flex items-center justify-center mb-4 shadow-lg"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                >
                  <Lock className="w-7 h-7 text-white" />
                </motion.div>
                <CardTitle className="text-2xl text-white">Encode (Hide a Message)</CardTitle>
                <CardDescription className="text-stone-200 text-base leading-relaxed">
                  Encrypt your secret message with ChaCha20 and embed it into an image using LSB steganography.
                  Generate a SHA-256 hash for integrity verification.
                </CardDescription>
              </CardHeader>
              <CardContent className="mt-auto">
                <Link to="/encode">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.1 }}
                  >
                    <Button className="w-full bg-gradient-to-r from-lime-500 to-yellow-500 hover:from-lime-600 hover:to-yellow-600 text-white shadow-lg font-semibold" size="lg">
                      Start Encoding
                    </Button>
                  </motion.div>
                </Link>
              </CardContent>
            </Card>
          </motion.div>

          {/* Decode Card */}
          <motion.div variants={cardVariants} whileHover="hover">
            <Card className="bg-stone-800/70 border-stone-600/40 shadow-2xl shadow-black/30 hover:border-amber-500/60 hover:shadow-amber-500/20 transition-all duration-300 backdrop-blur-sm flex flex-col h-full">
              <CardHeader className="flex-1">
                <motion.div 
                  className="w-14 h-14 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-xl flex items-center justify-center mb-4 shadow-lg"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                >
                  <Unlock className="w-7 h-7 text-white" />
                </motion.div>
                <CardTitle className="text-2xl text-white">Decode (Reveal a Message)</CardTitle>
                <CardDescription className="text-stone-200 text-base leading-relaxed">
                  Extract and decrypt hidden messages from steganographic images. 
                  Verify data integrity using SHA-256 hash validation.
                </CardDescription>
              </CardHeader>
              <CardContent className="mt-auto">
                <Link to="/decode">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.1 }}
                  >
                    <Button className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white shadow-lg font-semibold" size="lg">
                      Start Decoding
                    </Button>
                  </motion.div>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <motion.div 
          className="mt-12 bg-stone-800/70 border border-stone-600/40 rounded-xl p-6 shadow-2xl shadow-black/30 backdrop-blur-sm"
          variants={itemVariants}
        >
          <h2 className="text-xl mb-4 text-white">Security Features</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { icon: "🔐", title: "ChaCha20 Encryption", desc: "Military-grade stream cipher protecting your message content", color: "lime" },
              { icon: "👁️", title: "LSB Steganography", desc: "Imperceptible embedding in image pixel data", color: "amber" },
              { icon: "✓", title: "SHA-256 Verification", desc: "Cryptographic tamper detection for data integrity", color: "lime" }
            ].map((feature, index) => (
              <motion.div
                key={index}
                className="bg-stone-700/50 p-4 rounded-lg border border-stone-600/30 hover:border-lime-400/50 transition-all duration-300"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1, duration: 0.4 }}
                whileHover={{ y: -2 }}
              >
                <div className={`text-${feature.color}-400 mb-2 text-lg`}>{feature.icon} {feature.title}</div>
                <p className="text-sm text-stone-200">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}