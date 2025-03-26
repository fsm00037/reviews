"use client"

import Link from "next/link"
import { ArrowRight, Sparkles, BarChart3, UserCircle2, MessageSquare } from "lucide-react"
import { motion } from "framer-motion"
import { useState } from "react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import AnimatedBackground from "@/components/animated-background"
import { ThemeToggle } from "@/components/theme-toggle"

export default function Home() {
  const [hovered, setHovered] = useState(false)
  const { theme, setTheme } = useTheme()

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  }

  return (
    <div className="flex flex-col min-h-screen">
      <AnimatedBackground />

      <header className="px-4 lg:px-6 h-16 flex items-center backdrop-blur-md bg-white/70 dark:bg-gray-950/70 border-b border-purple-100 dark:border-gray-800 sticky top-0 z-50">
        <Link className="flex items-center justify-center" href="#">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="mr-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-lg p-1.5"
          >
            <Sparkles className="h-5 w-5 text-white" />
          </motion.div>
          <motion.span
            initial={{ x: -10, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
          >
            ReviewSim 2025
          </motion.span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6 items-center">
          <Link
            className="text-sm font-medium hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
            href="#"
          >
            About
          </Link>
          <Link
            className="text-sm font-medium hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
            href="#"
          >
            Help
          </Link>
          <ThemeToggle />
        </nav>
      </header>
      <main className="flex-1 relative z-10">
        <section className="w-full py-12 md:py-24 lg:py-32 overflow-hidden">
          <div className="container px-4 md:px-6 relative">
            <motion.div
              initial="hidden"
              animate="show"
              variants={container}
              className="flex flex-col items-center justify-center space-y-8 text-center relative z-10"
            >
              <motion.div variants={item} className="space-y-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.2 }}
                  className="inline-block bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-1 rounded-lg mb-4"
                >
                  <span className="bg-white dark:bg-gray-950 rounded-md px-3 py-1 text-sm font-medium block">
                    Next-Gen Review Simulation
                  </span>
                </motion.div>
                <motion.h1
                  variants={item}
                  className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
                >
                  Product Review Simulator
                </motion.h1>
                <motion.p variants={item} className="mx-auto max-w-[700px] text-gray-600 dark:text-gray-300 md:text-xl">
                  Generate hyper-realistic product reviews with AI-powered bot profiles and comprehensive analysis
                </motion.p>
              </motion.div>
              <motion.div variants={item} className="w-full max-w-sm space-y-2">
                <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
                  <Input
                    className="max-w-lg flex-1 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-purple-200 dark:border-gray-700 focus-visible:ring-purple-500"
                    placeholder="Enter product URL or start a new simulation"
                    type="text"
                  />
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      asChild
                      className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white hover:opacity-90 transition-opacity"
                      onMouseEnter={() => setHovered(true)}
                      onMouseLeave={() => setHovered(false)}
                    >
                      <Link href="/simulator" className="relative group">
                        <span>Start</span>
                        <motion.div
                          animate={{ x: hovered ? 5 : 0 }}
                          transition={{ type: "spring", stiffness: 400, damping: 10 }}
                        >
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </motion.div>
                        <span className="absolute inset-0 rounded-md bg-white dark:bg-gray-950 opacity-0 group-hover:opacity-20 transition-opacity" />
                      </Link>
                    </Button>
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32 backdrop-blur-sm bg-white/30 dark:bg-gray-900/30 relative z-10">
          <div className="container px-4 md:px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="mx-auto grid max-w-5xl items-center gap-6 lg:grid-cols-2 lg:gap-12"
            >
              <div className="space-y-4">
                <div className="inline-block bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-1 rounded-lg">
                  <span className="bg-white dark:bg-gray-950 rounded-md px-3 py-1 text-sm font-medium block">
                    How it works
                  </span>
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
                  Simulate product reviews in five simple steps
                </h2>
                <p className="max-w-[600px] text-gray-600 dark:text-gray-300 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Our platform allows you to generate realistic product reviews with customizable bot profiles and
                  provides comprehensive analysis to improve your product.
                </p>
              </div>
              <div className="grid gap-4">
                {[
                  {
                    icon: <Sparkles className="h-5 w-5 text-indigo-500" />,
                    title: "1. Product Information",
                    description: "Enter a product URL or create a new product simulation",
                    content:
                      "Our system will display detailed product information including images, descriptions, and specifications.",
                  },
                  {
                    icon: <UserCircle2 className="h-5 w-5 text-purple-500" />,
                    title: "2. Configure Bot Population",
                    description: "Adjust parameters to generate a population of realistic bot users",
                    content:
                      "Customize the number of bots, demographic distribution, and personality traits to create a diverse set of reviewers.",
                  },
                  {
                    icon: <UserCircle2 className="h-5 w-5 text-pink-500" />,
                    title: "3. Review Bot Profiles",
                    description: "Examine the generated bot profiles before creating reviews",
                    content:
                      "Review the demographic and personality traits of each bot to ensure they match your target audience before generating reviews.",
                  },
                  {
                    icon: <MessageSquare className="h-5 w-5 text-indigo-500" />,
                    title: "4. Generate Reviews",
                    description: "Each bot will generate an Amazon-style review based on their profile",
                    content:
                      "Reviews will reflect the bot's personality, writing style, and opinion of the product, creating a realistic simulation.",
                  },
                  {
                    icon: <BarChart3 className="h-5 w-5 text-purple-500" />,
                    title: "5. Analysis Dashboard",
                    description: "Get comprehensive insights from the generated reviews",
                    content:
                      "View detailed analytics, sentiment analysis, key strengths and areas for improvement based on the simulated customer feedback.",
                  },
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                  >
                    <Card className="overflow-hidden border-purple-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm hover:shadow-lg hover:shadow-purple-200/20 dark:hover:shadow-purple-900/20 transition-all duration-300">
                      <CardHeader className="bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-pink-500/5">
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                          {item.icon}
                          {item.title}
                        </CardTitle>
                        <CardDescription>{item.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{item.content}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>
      </main>
      <footer className="bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-t border-purple-100 dark:border-gray-800 relative z-10">
        <div className="container flex flex-col gap-2 sm:flex-row py-6 px-4 md:px-6">
          <p className="text-xs text-gray-500 dark:text-gray-400">© 2025 ReviewSim. All rights reserved.</p>
          <nav className="sm:ml-auto flex gap-4 sm:gap-6">
            <Link
              className="text-xs text-gray-500 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400 transition-colors"
              href="#"
            >
              Terms of Service
            </Link>
            <Link
              className="text-xs text-gray-500 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400 transition-colors"
              href="#"
            >
              Privacy
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}

