"use client"

import { useState, useEffect } from "react"
import { motion, useScroll, useTransform, useSpring, useAnimation } from "framer-motion"
import { Menu, X, ArrowRight, Repeat, BarChart2, Mic, Globe, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"

import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"

export default function Home() {
  const { scrollYProgress } = useScroll()
  const controls = useAnimation()

  // Smooth scroll progress for the progress bar
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  })

  // Parallax effect for floating circles
  const y1 = useTransform(scrollYProgress, [0, 1], [0, -100])
  const y2 = useTransform(scrollYProgress, [0, 1], [0, 100])
  const y3 = useTransform(scrollYProgress, [0, 1], [-50, 50])

  useEffect(() => {
    controls.start({
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" }
    })
  }, [controls])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50 dark:from-gray-900 dark:to-purple-900 overflow-hidden">
      {/* Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-blue-600 origin-left z-50"
        style={{ scaleX }}
      />

      {/* Floating Circles Background */}
      <div className=" inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 left-10 w-64 h-64 rounded-full bg-blue-400/20 blur-3xl"
          style={{ y: y1 }}
        />
        <motion.div
          className="absolute top-40 right-20 w-96 h-96 rounded-full bg-purple-400/20 blur-3xl"
          style={{ y: y2 }}
        />
        <motion.div
          className="absolute bottom-20 left-1/2 w-72 h-72 rounded-full bg-green-400/20 blur-3xl"
          style={{ y: y3 }}
        />
      </div>

      {/* Hero Section */}
      <section className=" pt-32 pb-20">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={controls}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
              Trading is now intelligent
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8">
              Execute cross-chain trades effortlessly with AI-powered natural language processing
            </p>
            <div className="flex justify-center space-x-4">
              <Link href='/agent'>
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                  Start Trading
                </Button>
              </Link>
              <Button size="lg" variant="outline">
                Contact Us
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Cards */}
      <section id="features" className="py-20">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
            <FeatureCard
              icon={<Repeat className="h-10 w-10 text-purple-500" />}
              title="Cross-Chain Trading"
              description="Execute trades across multiple blockchain networks with a single command"
              gradient="from-blue-500 to-purple-500"
            />
            <FeatureCard
              icon={<Mic className="h-10 w-10 text-pink-500" />}
              title="Voice Commands"
              description="Trade using natural voice commands in multiple languages"
              gradient="from-purple-500 to-pink-500"
            />
            <FeatureCard
              icon={<BarChart2 className="h-10 w-10 text-red-500" />}
              title="AI Analysis"
              description="Get real-time insights and recommendations powered by AI"
              gradient="from-pink-500 to-red-500"
            />
            <FeatureCard
              icon={<Globe className="h-10 w-10 text-red-500" />}
              title="Multi-Chain Supports"
              description="Access a wide range of blockchain networks and protocols"
              gradient="from-pink-500 to-red-500"
            />
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="container mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold mb-8 text-center">How it Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="bg-blue-100 dark:bg-blue-900 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">1</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Connect Your Wallet</h3>
            <p>Securely link your preferred crypto wallet to get started</p>
          </div>
          <div className="text-center">
            <div className="bg-blue-100 dark:bg-blue-900 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">2</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Describe Your Trade</h3>
            <p>Use natural language to explain the trade you want to execute</p>
          </div>
          <div className="text-center">
            <div className="bg-blue-100 dark:bg-blue-900 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">3</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Confirm and Execute</h3>
            <p>Review the AI-generated trade details and confirm to execute</p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-white dark:bg-gray-800 py-16">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold mb-8 text-center">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <FAQItem
              question="How secure is the MultiChain AI Trading Agent?"
              answer="We prioritize security with end-to-end encryption, secure wallet connections, and regular security audits. Your funds and data are always protected."
            />
            <FAQItem
              question="Which languages are supported for voice commands?"
              answer="Currently, we support English, Spanish, French, German, Italian, and Portuguese for voice commands and natural language processing."
            />
            <FAQItem
              question="How does cross-chain trading work?"
              answer="Our AI agent handles all the complexities of cross-chain trades, including chain switching, gas fee estimation, and optimal route finding, all behind the scenes."
            />
            <FAQItem
              question="Is there a fee for using the MultiChain AI Trading Agent?"
              answer="We charge a small fee on each transaction to maintain and improve our service. The fee is always transparently displayed before you confirm any trade."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-12 text-white text-center"
          >
            <h2 className="text-4xl font-bold mb-4">Ready to start trading?</h2>
            <p className="text-xl mb-8">Try the new Multichain AI Trading now for free!!!</p>
            <Link href='/agent'>
              <Button size="lg" variant="secondary" className="bg-white text-blue-600 hover:bg-gray-100">
                Get Started Now
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

function NavLink({ href, children }) {
  return (
    <a
      href={href}
      className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
    >
      {children}
    </a>
  )
}

function MobileMenu({ isOpen, setIsOpen }) {
  return (
    <div className="md:hidden">
      <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="absolute top-full left-0 right-0 bg-white dark:bg-gray-900 py-4 px-6 shadow-lg"
        >
          <div className="flex flex-col space-y-4">
            <NavLink href="#features">Features</NavLink>
            <NavLink href="#solutions">Solutions</NavLink>
            <NavLink href="#developers">Developers</NavLink>
            <NavLink href="#about">About</NavLink>
          </div>
        </motion.div>
      )}
    </div>
  )
}

function FeatureCard({ icon, title, description, gradient }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="relative overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-10`} />
        <CardContent className="p-6">
          <div className="mb-4">{icon}</div>
          <h3 className="text-xl font-semibold mb-2">{title}</h3>
          <p className="text-gray-600 dark:text-gray-300">{description}</p>
          <Button variant="ghost" className="mt-4">
            Learn More <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function StatCard({ number, label }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      className="text-center"
    >
      <div className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
        {number}
      </div>
      <div className="text-gray-600 dark:text-gray-300 mt-2">{label}</div>
    </motion.div>
  )


}

function FAQItem({ question, answer }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
      <button
        className="flex justify-between items-center w-full text-left"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="font-semibold">{question}</span>
        <ChevronDown className={`h-5 w-5 transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && <p className="mt-2">{answer}</p>}
    </div>
  )
}