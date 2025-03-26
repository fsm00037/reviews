"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  ArrowLeft,
  Star,
  Sparkles,
  Zap,
  Users,
  MessageSquare,
  ArrowRight,
  Rocket,
  UserCircle2,
  BarChart3,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
} from "lucide-react"
import { FanIcon as MaleIcon } from "lucide-react"
import { FanIcon as FemaleIcon } from "lucide-react"
import AnimatedBackground from "@/components/animated-background"
import RocketProgressBar from "@/components/rocket-progress-bar"
import { CustomRangeSlider } from "@/components/custom-range-slider"

// Añadir esta importación al inicio del archivo
// Reemplazar la importación anterior
import { ThemeToggle } from "@/components/theme-toggle"
import { useTheme } from "next-themes"
import { Progress } from "@/components/ui/progress"

// Types for our application
interface Product {
  name: string
  description: string
  price: string
  image: string
  category: string
}

interface BotProfile {
  id: number
  name: string
  avatar: string
  bio: string
  age: number
  location: string
  gender: string
  educationLevel: string
  personality: {
    introvertExtrovert: number
    analyticalCreative: number
    busyFreeTime: number
    disorganizedOrganized: number
    independentCooperative: number
    environmentalist: number
    safeRisky: number
  }
}

interface Review {
  id: number
  botId: number
  rating: number
  title: string
  content: string
  date: string
  helpfulVotes: number
}

interface DemographicConfig {
  ageRange: [number, number]
  educationRange: [number, number]
  genderRatio: number // 0-100, percentage of males
}

interface PersonalityConfig {
  introvertExtrovert: [number, number]
  analyticalCreative: [number, number]
  busyFreeTime: [number, number]
  disorganizedOrganized: [number, number]
  independentCooperative: [number, number]
  environmentalist: [number, number]
  safeRisky: [number, number]
}

interface KeywordAnalysis {
  word: string
  count: number
  sentiment: "positive" | "negative" | "neutral"
}

interface AnalysisResult {
  averageRating: number
  ratingDistribution: number[]
  positivePoints: string[]
  negativePoints: string[]
  keywordAnalysis: KeywordAnalysis[]
  demographicInsights: string[]
}

export default function SimulatorPage() {
  // Dentro de la función SimulatorPage, añadir:
  const { theme, setTheme } = useTheme()

  // State for product information
  const [product, setProduct] = useState<Product>({
    name: "Premium Wireless Headphones",
    description:
      "Experience crystal-clear sound with our premium wireless headphones. Featuring active noise cancellation, 30-hour battery life, and comfortable over-ear design.",
    price: "$149.99",
    image: "/placeholder.svg?height=300&width=300",
    category: "Electronics",
  })

  // State for bot configuration
  const [populationRange, setPopulationRange] = useState<[number, number]>([3, 8])
  const [positivityBias, setPositivityBias] = useState<[number, number]>([60, 80])
  const [verbosity, setVerbosity] = useState<[number, number]>([40, 70])
  const [detailLevel, setDetailLevel] = useState<[number, number]>([50, 80])

  // New demographic configuration
  const [demographics, setDemographics] = useState<DemographicConfig>({
    ageRange: [25, 45],
    educationRange: [12, 18], // Years of education (12 = high school, 16 = bachelor's, 18 = master's)
    genderRatio: 50, // 50% male, 50% female
  })

  // New personality configuration with ranges
  const [personality, setPersonality] = useState<PersonalityConfig>({
    introvertExtrovert: [40, 80],
    analyticalCreative: [30, 60],
    busyFreeTime: [50, 90],
    disorganizedOrganized: [40, 70],
    independentCooperative: [10, 40],
    environmentalist: [50, 80],
    safeRisky: [60, 90],
  })

  // State for generated bots and reviews
  const [bots, setBots] = useState<BotProfile[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [activeStep, setActiveStep] = useState(0)
  const [isGeneratingBots, setIsGeneratingBots] = useState(false)
  const [isGeneratingReviews, setIsGeneratingReviews] = useState(false)
  const [isGeneratingAnalysis, setIsGeneratingAnalysis] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)

  // Actualizar los pasos para incluir la nueva fase de dashboard
  const steps = ["Product", "Configure", "Profiles", "Reviews", "Dashboard"]

  // Function to handle product form submission
  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real app, this would fetch product data from the URL
    // For now, we'll just use the current state
    setActiveStep(1)
  }

  // Function to generate bot profiles
  const generateBots = () => {
    setIsGeneratingBots(true)

    setTimeout(() => {
      const newBots: BotProfile[] = []
      const maleFirstNames = [
        "James",
        "John",
        "Robert",
        "Michael",
        "William",
        "David",
        "Richard",
        "Joseph",
        "Thomas",
        "Charles",
      ]
      const femaleFirstNames = [
        "Mary",
        "Patricia",
        "Jennifer",
        "Linda",
        "Elizabeth",
        "Susan",
        "Jessica",
        "Sarah",
        "Karen",
        "Nancy",
      ]
      const lastNames = [
        "Smith",
        "Johnson",
        "Williams",
        "Jones",
        "Brown",
        "Davis",
        "Miller",
        "Wilson",
        "Moore",
        "Taylor",
        "Anderson",
        "Thomas",
        "Jackson",
        "White",
        "Harris",
        "Martin",
        "Thompson",
        "Garcia",
        "Martinez",
        "Robinson",
      ]

      const cities = [
        "New York",
        "Los Angeles",
        "Chicago",
        "Houston",
        "Phoenix",
        "Philadelphia",
        "San Antonio",
        "San Diego",
        "Dallas",
        "San Jose",
      ]
      const states = ["NY", "CA", "IL", "TX", "AZ", "PA", "TX", "CA", "TX", "CA"]

      const educationLevels = [
        "High School",
        "Some College",
        "Associate's Degree",
        "Bachelor's Degree",
        "Master's Degree",
        "Doctorate",
      ]

      const bioTemplates = [
        "Avid online shopper with a keen eye for quality products.",
        "Tech enthusiast who loves trying out the latest gadgets.",
        "Practical consumer focused on value and durability.",
        "Detail-oriented reviewer who tests products thoroughly.",
        "Casual shopper who appreciates good customer service.",
        "Budget-conscious buyer always looking for the best deals.",
        "Luxury product collector with high standards.",
        "Minimalist who only purchases essential items.",
        "Parent who reviews products for the whole family.",
        "Professional in the industry with expert knowledge.",
      ]

      // Generate a random number of bots within the specified range
      const numBots = Math.floor(Math.random() * (populationRange[1] - populationRange[0] + 1)) + populationRange[0]

      for (let i = 0; i < numBots; i++) {
        // Determine gender based on gender ratio
        const isMale = Math.random() * 100 < demographics.genderRatio

        // Select name based on gender
        const firstName = isMale
          ? maleFirstNames[Math.floor(Math.random() * maleFirstNames.length)]
          : femaleFirstNames[Math.floor(Math.random() * femaleFirstNames.length)]

        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]
        const name = `${firstName} ${lastName}`
        const initials = `${firstName[0]}${lastName[0]}`

        // Generate age within the specified range
        const age =
          Math.floor(Math.random() * (demographics.ageRange[1] - demographics.ageRange[0] + 1)) +
          demographics.ageRange[0]

        // Generate location
        const locationIndex = Math.floor(Math.random() * cities.length)
        const location = `${cities[locationIndex]}, ${states[locationIndex]}`

        // Determine education level based on education range
        const yearsOfEducation =
          Math.floor(Math.random() * (demographics.educationRange[1] - demographics.educationRange[0] + 1)) +
          demographics.educationRange[0]
        let educationLevel

        if (yearsOfEducation <= 12) {
          educationLevel = educationLevels[0] // High School
        } else if (yearsOfEducation <= 14) {
          educationLevel = educationLevels[1] // Some College
        } else if (yearsOfEducation <= 15) {
          educationLevel = educationLevels[2] // Associate's
        } else if (yearsOfEducation <= 16) {
          educationLevel = educationLevels[3] // Bachelor's
        } else if (yearsOfEducation <= 18) {
          educationLevel = educationLevels[4] // Master's
        } else {
          educationLevel = educationLevels[5] // Doctorate
        }

        // Generate personality traits within the specified ranges
        const generateTraitValue = (range: [number, number]) => {
          return Math.floor(Math.random() * (range[1] - range[0] + 1)) + range[0]
        }

        const bio = bioTemplates[Math.floor(Math.random() * bioTemplates.length)]

        newBots.push({
          id: i + 1,
          name,
          avatar: `/placeholder.svg?height=100&width=100&text=${initials}`,
          bio,
          age,
          location,
          gender: isMale ? "Male" : "Female",
          educationLevel,
          personality: {
            introvertExtrovert: generateTraitValue(personality.introvertExtrovert),
            analyticalCreative: generateTraitValue(personality.analyticalCreative),
            busyFreeTime: generateTraitValue(personality.busyFreeTime),
            disorganizedOrganized: generateTraitValue(personality.disorganizedOrganized),
            independentCooperative: generateTraitValue(personality.independentCooperative),
            environmentalist: generateTraitValue(personality.environmentalist),
            safeRisky: generateTraitValue(personality.safeRisky),
          },
        })
      }

      setBots(newBots)
      setIsGeneratingBots(false)
      // Ahora avanzamos a la fase de perfiles en lugar de generar reseñas directamente
      setActiveStep(2)
    }, 1500)
  }

  // Function to generate reviews based on bot profiles
  const generateReviews = () => {
    setIsGeneratingReviews(true)

    setTimeout(() => {
      const newReviews: Review[] = []
      const reviewTitlePositive = [
        "Excellent product, highly recommend!",
        "Exceeded my expectations!",
        "Best purchase I've made this year",
        "Absolutely love this product",
        "Great value for money",
      ]

      const reviewTitleNeutral = [
        "Decent product with some flaws",
        "Good but not great",
        "Meets basic expectations",
        "Average quality for the price",
        "Has pros and cons",
      ]

      const reviewTitleNegative = [
        "Disappointed with this purchase",
        "Not worth the money",
        "Had to return it",
        "Wouldn't recommend",
        "Several issues with this product",
      ]

      const reviewContentPositive = [
        "I've been using this product for a few weeks now and I'm extremely satisfied. The quality is outstanding and it performs exactly as described. The design is sleek and modern, and it fits perfectly into my lifestyle. Customer service was also excellent when I had a question. Highly recommend!",
        "This product has completely changed my daily routine for the better. The features are intuitive and well-designed, and the build quality is exceptional. It arrived quickly and was easy to set up. I've already recommended it to several friends who are equally impressed.",
        "After researching several options, I'm glad I chose this one. The attention to detail is evident in every aspect of the product. It's durable, efficient, and looks great. The price point is fair for the quality you receive. Definitely a five-star product!",
      ]

      const reviewContentNeutral = [
        "This product is adequate for basic needs but doesn't offer anything special. The quality is acceptable but not outstanding. I've had it for about a month with no issues, but also no wow factor. It does what it's supposed to do, but I was hoping for more features at this price point.",
        "Mixed feelings about this purchase. On one hand, it works as described and the design is nice. On the other hand, there are some minor quality issues and the user experience could be improved. It's not bad, but there's definitely room for improvement.",
        "An average product that meets basic expectations. Setup was straightforward and it functions properly, but there are competitors offering more features at similar prices. The customer service was responsive when I had questions, which is a plus.",
      ]

      const reviewContentNegative = [
        "Unfortunately, this product didn't meet my expectations. The quality feels cheap compared to the price, and there were several functional issues right out of the box. The customer service was unhelpful when I tried to resolve the problems. I would not recommend this to others.",
        "I regret this purchase and have already started the return process. The product arrived damaged and even after replacement, it didn't work as advertised. The design is clunky and unintuitive, making it frustrating to use. Save your money and look elsewhere.",
        "This has been a disappointing experience from start to finish. The product is nothing like the description, with poor build quality and missing features. It stopped working correctly after just a few days of light use. Definitely not worth the price.",
      ]

      const months = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ]
      const currentDate = new Date()

      bots.forEach((bot, index) => {
        // Generate a random positivity bias within the specified range
        const randomPositivityBias =
          Math.floor(Math.random() * (positivityBias[1] - positivityBias[0] + 1)) + positivityBias[0]

        // Determine rating based on personality traits and positivity bias
        let ratingBias = randomPositivityBias

        // Adjust rating based on personality traits
        // More extroverted people tend to be more positive
        if (bot.personality.introvertExtrovert > 70) ratingBias += 10

        // More creative people might be more critical
        if (bot.personality.analyticalCreative < 30) ratingBias -= 5

        // Busy people might be more critical
        if (bot.personality.busyFreeTime < 40) ratingBias -= 5

        // Organized people might have higher standards
        if (bot.personality.disorganizedOrganized > 80) ratingBias -= 10

        // Risk-takers might be more forgiving
        if (bot.personality.safeRisky > 70) ratingBias += 5

        // Determine final rating
        let rating: number
        const randomFactor = Math.random() * 100
        if (randomFactor < ratingBias) {
          // Positive review (4-5 stars)
          rating = Math.random() < 0.6 ? 5 : 4
        } else if (randomFactor < ratingBias + (100 - ratingBias) / 2) {
          // Neutral review (3 stars)
          rating = 3
        } else {
          // Negative review (1-2 stars)
          rating = Math.random() < 0.6 ? 2 : 1
        }

        // Select title based on rating
        let title: string
        if (rating >= 4) {
          title = reviewTitlePositive[Math.floor(Math.random() * reviewTitlePositive.length)]
        } else if (rating === 3) {
          title = reviewTitleNeutral[Math.floor(Math.random() * reviewTitleNeutral.length)]
        } else {
          title = reviewTitleNegative[Math.floor(Math.random() * reviewTitleNegative.length)]
        }

        // Select content based on rating
        let content: string
        if (rating >= 4) {
          content = reviewContentPositive[Math.floor(Math.random() * reviewContentPositive.length)]
        } else if (rating === 3) {
          content = reviewContentNeutral[Math.floor(Math.random() * reviewContentNeutral.length)]
        } else {
          content = reviewContentNegative[Math.floor(Math.random() * reviewContentNegative.length)]
        }

        // Generate a random verbosity level within the specified range
        const randomVerbosity = Math.floor(Math.random() * (verbosity[1] - verbosity[0] + 1)) + verbosity[0]

        // Adjust content length based on verbosity setting and personality
        let verbosityAdjusted = randomVerbosity

        // Extroverts tend to be more verbose
        if (bot.personality.introvertExtrovert > 70) verbosityAdjusted += 20

        // Creative people might write more
        if (bot.personality.analyticalCreative > 70) verbosityAdjusted += 15

        // Busy people might write less
        if (bot.personality.busyFreeTime < 30) verbosityAdjusted -= 20

        if (verbosityAdjusted < 30) {
          content = content.split(". ").slice(0, 2).join(". ") + "."
        } else if (verbosityAdjusted > 70) {
          content = content + " " + content.split(". ").slice(0, 3).join(". ") + "."
        }

        // Generate a random detail level within the specified range
        const randomDetailLevel = Math.floor(Math.random() * (detailLevel[1] - detailLevel[0] + 1)) + detailLevel[0]

        // Add product-specific details based on detail level and personality
        let detailLevelAdjusted = randomDetailLevel

        // Analytical people might include more details
        if (bot.personality.analyticalCreative < 30) detailLevelAdjusted += 15

        // Organized people might be more detailed
        if (bot.personality.disorganizedOrganized > 70) detailLevelAdjusted += 10

        if (detailLevelAdjusted > 50) {
          const productDetails = [
            `The ${product.name} is exactly what I was looking for.`,
            `For the price of ${product.price}, I expected better quality.`,
            `This fits perfectly in my collection of ${product.category} products.`,
            `I specifically bought this for the ${product.description.split(" ").slice(0, 3).join(" ")} feature.`,
            `Compared to other ${product.category} products I've used, this one stands out.`,
          ]

          content += " " + productDetails[Math.floor(Math.random() * productDetails.length)]
        }

        // Add personality-specific comments
        if (bot.personality.environmentalist > 70) {
          content += " I appreciate that the packaging was minimal and recyclable."
        }

        if (bot.personality.safeRisky > 70) {
          content += " I took a chance on this product despite the mixed reviews, and I'm glad I did."
        }

        if (bot.personality.independentCooperative > 70) {
          content += " I've shared this with my friends and they all love it too."
        }

        // Generate random date within the last 3 months
        const randomDaysAgo = Math.floor(Math.random() * 90)
        const reviewDate = new Date(currentDate)
        reviewDate.setDate(currentDate.getDate() - randomDaysAgo)
        const formattedDate = `${months[reviewDate.getMonth()]} ${reviewDate.getDate()}, ${reviewDate.getFullYear()}`

        // Generate random helpful votes
        const helpfulVotes = Math.floor(Math.random() * 50)

        newReviews.push({
          id: index + 1,
          botId: bot.id,
          rating,
          title,
          content,
          date: formattedDate,
          helpfulVotes,
        })
      })

      setReviews(newReviews)
      setIsGeneratingReviews(false)
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 3000)
      setActiveStep(3)
    }, 1500)
  }

  // Function to generate analysis based on reviews
  const generateAnalysis = () => {
    setIsGeneratingAnalysis(true)

    setTimeout(() => {
      // Calculate average rating
      const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length

      // Calculate rating distribution
      const ratingDistribution = [0, 0, 0, 0, 0] // Index 0 = 1 star, index 4 = 5 stars
      reviews.forEach((review) => {
        ratingDistribution[review.rating - 1]++
      })

      // Extract positive and negative points
      const positivePoints = [
        "High sound quality consistently mentioned in positive reviews",
        "Comfortable design for extended wear",
        "Battery life exceeds expectations",
        "Noise cancellation feature highly praised",
        "Good value for money compared to competitors",
      ]

      const negativePoints = [
        "Some users report connectivity issues",
        "Build quality concerns mentioned in multiple reviews",
        "Price point considered high by budget-conscious users",
        "Limited color options available",
        "App functionality could be improved",
      ]

      // Generate keyword analysis
      const keywordAnalysis: KeywordAnalysis[] = [
        { word: "sound", count: 12, sentiment: "positive" },
        { word: "quality", count: 10, sentiment: "positive" },
        { word: "comfortable", count: 8, sentiment: "positive" },
        { word: "battery", count: 7, sentiment: "positive" },
        { word: "price", count: 6, sentiment: "neutral" },
        { word: "noise", count: 5, sentiment: "positive" },
        { word: "app", count: 4, sentiment: "negative" },
        { word: "connectivity", count: 3, sentiment: "negative" },
        { word: "design", count: 3, sentiment: "positive" },
        { word: "durability", count: 2, sentiment: "neutral" },
      ]

      // Generate demographic insights
      const demographicInsights = [
        "Younger users (18-30) tend to focus more on style and app features",
        "Older users (45+) emphasize comfort and ease of use",
        "Higher educated users provide more detailed technical feedback",
        "Male users mention battery life more frequently",
        "Female users comment more on design and comfort",
      ]

      const result: AnalysisResult = {
        averageRating,
        ratingDistribution,
        positivePoints,
        negativePoints,
        keywordAnalysis,
        demographicInsights,
      }

      setAnalysisResult(result)
      setIsGeneratingAnalysis(false)
      setActiveStep(4)
    }, 2000)
  }

  // Confetti animation
  const Confetti = () => {
    const confettiCount = 100
    const colors = ["#FF5733", "#33FF57", "#3357FF", "#F3FF33", "#FF33F3"]

    return (
      <div className="fixed inset-0 pointer-events-none z-50">
        {Array.from({ length: confettiCount }).map((_, i) => {
          const left = Math.random() * 100
          const animationDuration = 2 + Math.random() * 3
          const delay = Math.random()
          const size = 5 + Math.random() * 10
          const color = colors[Math.floor(Math.random() * colors.length)]

          return (
            <motion.div
              key={i}
              initial={{
                top: -20,
                left: `${left}%`,
                opacity: 1,
                rotate: 0,
              }}
              animate={{
                top: "100vh",
                left: `${left + (Math.random() * 20 - 10)}%`,
                opacity: 0,
                rotate: Math.random() * 360,
              }}
              transition={{
                duration: animationDuration,
                delay: delay,
                ease: "easeOut",
              }}
              style={{
                position: "absolute",
                width: size,
                height: size,
                backgroundColor: color,
                borderRadius: Math.random() > 0.5 ? "50%" : "0%",
              }}
            />
          )
        })}
      </div>
    )
  }

  // Space theme stars background
  const SpaceStars = () => {
    return (
      <div className="fixed inset-0 z-0">
        {Array.from({ length: 50 }).map((_, i) => {
          const size = Math.random() * 2 + 1
          const top = Math.random() * 100
          const left = Math.random() * 100
          const animationDelay = Math.random() * 5

          return (
            <motion.div
              key={i}
              className="absolute bg-white rounded-full"
              style={{
                width: size,
                height: size,
                top: `${top}%`,
                left: `${left}%`,
              }}
              animate={{
                opacity: [0.2, 1, 0.2],
                scale: [1, 1.5, 1],
              }}
              transition={{
                repeat: Number.POSITIVE_INFINITY,
                duration: 3 + Math.random() * 2,
                delay: animationDelay,
                ease: "easeInOut",
              }}
            />
          )
        })}
      </div>
    )
  }

  // Componente para gráfico de barras de calificaciones
  const RatingBarChart = ({ distribution }: { distribution: number[] }) => {
    const total = distribution.reduce((sum, count) => sum + count, 0)
    const percentages = distribution.map((count) => (count / total) * 100)

    return (
      <div className="space-y-3">
        {[5, 4, 3, 2, 1].map((stars, index) => (
          <div key={stars} className="flex items-center gap-2">
            <div className="w-8 text-right font-medium">{stars}★</div>
            <div className="flex-1">
              <div className="h-5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${percentages[5 - stars]}%` }}
                  transition={{ duration: 1, delay: index * 0.1 }}
                />
              </div>
            </div>
            <div className="w-12 text-sm text-gray-500 dark:text-gray-400">
              {distribution[5 - stars]} ({percentages[5 - stars].toFixed(0)}%)
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Componente para gráfico circular de sentimiento
  const SentimentPieChart = () => {
    const positive = reviews.filter((r) => r.rating >= 4).length
    const neutral = reviews.filter((r) => r.rating === 3).length
    const negative = reviews.filter((r) => r.rating <= 2).length
    const total = reviews.length

    const positivePercent = (positive / total) * 100
    const neutralPercent = (neutral / total) * 100
    const negativePercent = (negative / total) * 100

    // Calcular ángulos para el gráfico circular
    const positiveAngle = (positive / total) * 360
    const neutralAngle = (neutral / total) * 360

    return (
      <div className="flex flex-col items-center">
        <div className="relative w-40 h-40">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            {/* Círculo base (negativo) */}
            <circle cx="50" cy="50" r="40" fill="#f87171" />

            {/* Sector neutral */}
            {neutral > 0 && (
              <motion.path
                d={`M 50 50 L 50 10 A 40 40 0 ${positiveAngle > 180 ? 1 : 0} 1 ${50 + 40 * Math.sin((positiveAngle * Math.PI) / 180)} ${50 - 40 * Math.cos((positiveAngle * Math.PI) / 180)} Z`}
                fill="#fbbf24"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              />
            )}

            {/* Sector positivo */}
            {positive > 0 && (
              <motion.path
                d={`M 50 50 L 50 10 A 40 40 0 0 1 ${50 + 40 * Math.sin(0)} ${50 - 40 * Math.cos(0)} Z`}
                fill="#4ade80"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.6 }}
              />
            )}

            {/* Círculo central */}
            <circle cx="50" cy="50" r="25" fill="white" className="dark:fill-gray-900" />
          </svg>

          <div className="absolute inset-0 flex items-center justify-center flex-col">
            <span className="text-2xl font-bold">{positivePercent.toFixed(0)}%</span>
            <span className="text-xs text-gray-500">Positive</span>
          </div>
        </div>

        <div className="flex justify-center gap-4 mt-4">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
            <span className="text-xs">Positive ({positive})</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-amber-400 rounded-full"></div>
            <span className="text-xs">Neutral ({neutral})</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-400 rounded-full"></div>
            <span className="text-xs">Negative ({negative})</span>
          </div>
        </div>
      </div>
    )
  }

  // Componente para nube de palabras clave
  const KeywordCloud = ({ keywords }: { keywords: KeywordAnalysis[] }) => {
    return (
      <div className="flex flex-wrap justify-center gap-2 p-4">
        {keywords.map((keyword, index) => {
          const fontSize = 0.8 + (keyword.count / 5) * 0.2 // Escala de 0.8 a 1.2rem
          const color =
            keyword.sentiment === "positive"
              ? "text-green-500 dark:text-green-400"
              : keyword.sentiment === "negative"
                ? "text-red-500 dark:text-red-400"
                : "text-gray-500 dark:text-gray-400"

          return (
            <motion.span
              key={keyword.word}
              className={`${color} font-medium px-2 py-1 rounded-full border border-gray-200 dark:border-gray-700`}
              style={{ fontSize: `${fontSize}rem` }}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              {keyword.word}
            </motion.span>
          )
        })}
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <AnimatedBackground />
      <SpaceStars />
      {showConfetti && <Confetti />}

      <div className="container mx-auto py-6 px-4 relative z-10">
        {/* Modificar la sección de la cabecera para incluir el botón de cambio de tema: */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center mb-6"
        >
          <Link href="/" className="mr-4">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full border-purple-200 dark:border-gray-700 hover:bg-purple-100 dark:hover:bg-gray-800 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
            Product Review Simulator
          </h1>
          {/* Reemplazar el botón de tema en la cabecera con: */}
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </motion.div>

        <div className="mb-8">
          <RocketProgressBar
            steps={steps}
            currentStep={activeStep}
            onStepClick={(step) => {
              // Only allow going back to previous steps or current step
              if (step <= activeStep) {
                setActiveStep(step)
              }
            }}
          />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {activeStep === 0 && (
              <Card className="border-purple-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10">
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-purple-500" />
                    Product Information
                  </CardTitle>
                  <CardDescription>Enter a product URL or provide details for a new product simulation</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <form onSubmit={handleProductSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="productUrl" className="text-sm font-medium">
                          Product URL (optional)
                        </Label>
                        <Input
                          id="productUrl"
                          placeholder="https://example.com/product"
                          className="bg-white/70 dark:bg-gray-800/70 border-purple-200 dark:border-gray-700 focus-visible:ring-purple-500"
                        />
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Or manually enter product details below
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="productImage" className="text-sm font-medium">
                          Product Image
                        </Label>
                        <div className="border border-purple-200 dark:border-gray-700 rounded-md p-2 flex justify-center bg-white/50 dark:bg-gray-800/50">
                          <motion.img
                            src={product.image || "/placeholder.svg"}
                            alt="Product"
                            className="h-40 w-40 object-contain"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: "spring", stiffness: 260, damping: 20 }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="productName" className="text-sm font-medium">
                        Product Name
                      </Label>
                      <Input
                        id="productName"
                        value={product.name}
                        onChange={(e) => setProduct({ ...product, name: e.target.value })}
                        className="bg-white/70 dark:bg-gray-800/70 border-purple-200 dark:border-gray-700 focus-visible:ring-purple-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="productDescription" className="text-sm font-medium">
                        Product Description
                      </Label>
                      <Textarea
                        id="productDescription"
                        rows={3}
                        value={product.description}
                        onChange={(e) => setProduct({ ...product, description: e.target.value })}
                        className="bg-white/70 dark:bg-gray-800/70 border-purple-200 dark:border-gray-700 focus-visible:ring-purple-500 min-h-[100px]"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="productPrice" className="text-sm font-medium">
                          Price
                        </Label>
                        <Input
                          id="productPrice"
                          value={product.price}
                          onChange={(e) => setProduct({ ...product, price: e.target.value })}
                          className="bg-white/70 dark:bg-gray-800/70 border-purple-200 dark:border-gray-700 focus-visible:ring-purple-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="productCategory" className="text-sm font-medium">
                          Category
                        </Label>
                        <Input
                          id="productCategory"
                          value={product.category}
                          onChange={(e) => setProduct({ ...product, category: e.target.value })}
                          className="bg-white/70 dark:bg-gray-800/70 border-purple-200 dark:border-gray-700 focus-visible:ring-purple-500"
                        />
                      </div>
                    </div>

                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white hover:opacity-90 transition-opacity"
                      >
                        Continue to Bot Configuration
                        <motion.div
                          animate={{ x: [0, 5, 0] }}
                          transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.5 }}
                        >
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </motion.div>
                      </Button>
                    </motion.div>
                  </form>
                </CardContent>
              </Card>
            )}

            {activeStep === 1 && (
              <Card className="border-purple-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-purple-500" />
                    Configure Bot Population
                  </CardTitle>
                  <CardDescription>Adjust parameters to generate a population of bot reviewers</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column - Population and Demographics */}
                    <div>
                      <div className="mb-8">
                        <h3 className="text-xl font-bold mb-4">Tamaño de la población</h3>
                        <CustomRangeSlider
                          label=""
                          minLabel="min"
                          maxLabel="max"
                          minValue={populationRange[0]}
                          maxValue={populationRange[1]}
                          absoluteMin={1}
                          absoluteMax={20}
                          onChange={(min, max) => setPopulationRange([min, max])}
                        />
                      </div>

                      <div className="mb-8">
                        <h3 className="text-xl font-bold mb-4">Demografía</h3>

                        <div className="mb-6">
                          <h4 className="text-lg font-semibold mb-2">Edad</h4>
                          <CustomRangeSlider
                            label=""
                            minLabel="min"
                            maxLabel="max"
                            minValue={demographics.ageRange[0]}
                            maxValue={demographics.ageRange[1]}
                            absoluteMin={18}
                            absoluteMax={80}
                            onChange={(min, max) => setDemographics({ ...demographics, ageRange: [min, max] })}
                          />
                        </div>

                        <div className="mb-6">
                          <h4 className="text-lg font-semibold mb-2">Nivel educativo</h4>
                          <CustomRangeSlider
                            label=""
                            minLabel="min"
                            maxLabel="max"
                            minValue={demographics.educationRange[0]}
                            maxValue={demographics.educationRange[1]}
                            absoluteMin={8}
                            absoluteMax={22}
                            onChange={(min, max) => setDemographics({ ...demographics, educationRange: [min, max] })}
                          />
                        </div>

                        <div className="mb-6">
                          <h4 className="text-lg font-semibold mb-2">Género</h4>
                          <div className="flex gap-4 mt-4">
                            <Button
                              onClick={() => setDemographics({ ...demographics, genderRatio: 100 })}
                              className={`flex-1 ${demographics.genderRatio === 100 ? "bg-green-500 hover:bg-green-600" : "bg-gray-200 hover:bg-gray-300 text-gray-800"}`}
                            >
                              M
                            </Button>
                            <Button
                              onClick={() => setDemographics({ ...demographics, genderRatio: 50 })}
                              className={`flex-1 ${demographics.genderRatio === 50 ? "bg-gradient-to-r from-green-500 to-orange-500 text-white" : "bg-gray-200 hover:bg-gray-300 text-gray-800"}`}
                            >
                              M/F
                            </Button>
                            <Button
                              onClick={() => setDemographics({ ...demographics, genderRatio: 0 })}
                              className={`flex-1 ${demographics.genderRatio === 0 ? "bg-orange-500 hover:bg-orange-600" : "bg-gray-200 hover:bg-gray-300 text-gray-800"}`}
                            >
                              F
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="mb-6">
                          <h4 className="text-lg font-semibold mb-2">Positivity Bias</h4>
                          <CustomRangeSlider
                            label=""
                            minValue={positivityBias[0]}
                            maxValue={positivityBias[1]}
                            absoluteMin={0}
                            absoluteMax={100}
                            onChange={(min, max) => setPositivityBias([min, max])}
                          />
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Higher values generate more positive reviews
                          </p>
                        </div>

                        <div className="mb-6">
                          <h4 className="text-lg font-semibold mb-2">Verbosity</h4>
                          <CustomRangeSlider
                            label=""
                            minValue={verbosity[0]}
                            maxValue={verbosity[1]}
                            absoluteMin={0}
                            absoluteMax={100}
                            onChange={(min, max) => setVerbosity([min, max])}
                          />
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Controls the length and detail of reviews
                          </p>
                        </div>

                        <div className="mb-6">
                          <h4 className="text-lg font-semibold mb-2">Product Detail Level</h4>
                          <CustomRangeSlider
                            label=""
                            minValue={detailLevel[0]}
                            maxValue={detailLevel[1]}
                            absoluteMin={0}
                            absoluteMax={100}
                            onChange={(min, max) => setDetailLevel([min, max])}
                          />
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            How much product-specific information to include in reviews
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Right Column - Personality */}
                    <div className="bg-amber-50 dark:bg-amber-950/30 p-6 rounded-xl">
                      <h3 className="text-xl font-bold mb-6">Personalidad</h3>

                      <div className="mb-6">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Introvertido</span>
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Extrovertido</span>
                        </div>
                        <CustomRangeSlider
                          label=""
                          minValue={personality.introvertExtrovert[0]}
                          maxValue={personality.introvertExtrovert[1]}
                          absoluteMin={0}
                          absoluteMax={100}
                          onChange={(min, max) => setPersonality({ ...personality, introvertExtrovert: [min, max] })}
                        />
                      </div>

                      <div className="mb-6">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Analítico</span>
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Creativo</span>
                        </div>
                        <CustomRangeSlider
                          label=""
                          minValue={personality.analyticalCreative[0]}
                          maxValue={personality.analyticalCreative[1]}
                          absoluteMin={0}
                          absoluteMax={100}
                          onChange={(min, max) => setPersonality({ ...personality, analyticalCreative: [min, max] })}
                        />
                      </div>

                      <div className="mb-6">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Ocupado</span>
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Tiempo libre</span>
                        </div>
                        <CustomRangeSlider
                          label=""
                          minValue={personality.busyFreeTime[0]}
                          maxValue={personality.busyFreeTime[1]}
                          absoluteMin={0}
                          absoluteMax={100}
                          onChange={(min, max) => setPersonality({ ...personality, busyFreeTime: [min, max] })}
                        />
                      </div>

                      <div className="mb-6">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Desorganizado</span>
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Organizado</span>
                        </div>
                        <CustomRangeSlider
                          label=""
                          minValue={personality.disorganizedOrganized[0]}
                          maxValue={personality.disorganizedOrganized[1]}
                          absoluteMin={0}
                          absoluteMax={100}
                          onChange={(min, max) => setPersonality({ ...personality, disorganizedOrganized: [min, max] })}
                        />
                      </div>

                      <div className="mb-6">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Independiente</span>
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Cooperativo</span>
                        </div>
                        <CustomRangeSlider
                          label=""
                          minValue={personality.independentCooperative[0]}
                          maxValue={personality.independentCooperative[1]}
                          absoluteMin={0}
                          absoluteMax={100}
                          onChange={(min, max) =>
                            setPersonality({ ...personality, independentCooperative: [min, max] })
                          }
                        />
                      </div>

                      <div className="mb-6">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Ecologista</span>
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">No ecologista</span>
                        </div>
                        <CustomRangeSlider
                          label=""
                          minValue={personality.environmentalist[0]}
                          maxValue={personality.environmentalist[1]}
                          absoluteMin={0}
                          absoluteMax={100}
                          onChange={(min, max) => setPersonality({ ...personality, environmentalist: [min, max] })}
                        />
                      </div>

                      <div className="mb-6">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Seguro</span>
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Arriesgado</span>
                        </div>
                        <CustomRangeSlider
                          label=""
                          minValue={personality.safeRisky[0]}
                          maxValue={personality.safeRisky[1]}
                          absoluteMin={0}
                          absoluteMax={100}
                          onChange={(min, max) => setPersonality({ ...personality, safeRisky: [min, max] })}
                        />
                      </div>
                    </div>
                  </div>

                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="mt-8">
                    <Button
                      onClick={generateBots}
                      className="w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white hover:opacity-90 transition-opacity relative overflow-hidden"
                      disabled={isGeneratingBots}
                    >
                      {isGeneratingBots ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                            className="mr-2"
                          >
                            <Zap className="h-4 w-4" />
                          </motion.div>
                          <span className="relative z-10">Generating Bot Profiles...</span>
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600"
                            animate={{
                              x: ["-100%", "100%"],
                            }}
                            transition={{
                              repeat: Number.POSITIVE_INFINITY,
                              duration: 2,
                              ease: "linear",
                            }}
                            style={{ opacity: 0.3 }}
                          />
                        </>
                      ) : (
                        <>
                          <UserCircle2 className="mr-2 h-4 w-4" />
                          <span>Generate Bot Profiles</span>
                        </>
                      )}
                    </Button>
                  </motion.div>
                </CardContent>
              </Card>
            )}

            {/* Fase para ver los perfiles generados */}
            {activeStep === 2 && (
              <Card className="border-purple-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10">
                  <CardTitle className="flex items-center gap-2">
                    <UserCircle2 className="h-5 w-5 text-purple-500" />
                    Bot Profiles
                  </CardTitle>
                  <CardDescription>Review the generated bot profiles before creating reviews</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {bots.map((bot, index) => (
                      <motion.div
                        key={bot.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Card className="h-full border-purple-100 dark:border-gray-800 hover:shadow-md transition-shadow">
                          <CardHeader className="pb-2">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-12 w-12 border-2 border-purple-200 dark:border-gray-700">
                                <AvatarImage src={bot.avatar} alt={bot.name} />
                                <AvatarFallback
                                  className={`${bot.gender === "Male" ? "bg-gradient-to-br from-blue-500 to-indigo-500" : "bg-gradient-to-br from-pink-500 to-purple-500"} text-white flex items-center justify-center`}
                                >
                                  {bot.gender === "Male" ? (
                                    <MaleIcon className="h-6 w-6" />
                                  ) : (
                                    <FemaleIcon className="h-6 w-6" />
                                  )}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <CardTitle className="text-lg">{bot.name}</CardTitle>
                                <CardDescription>
                                  {bot.age} • {bot.gender} • {bot.location}
                                </CardDescription>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-2">
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{bot.educationLevel}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">{bot.bio}</p>

                            <div className="space-y-2">
                              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Personality Traits
                              </h4>
                              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                                <div>
                                  <div className="flex justify-between">
                                    <span>Introvert</span>
                                    <span>Extrovert</span>
                                  </div>
                                  <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full mt-1">
                                    <div
                                      className="bg-gradient-to-r from-indigo-500 to-purple-500 h-1.5 rounded-full"
                                      style={{ width: `${bot.personality.introvertExtrovert}%` }}
                                    />
                                  </div>
                                </div>
                                <div>
                                  <div className="flex justify-between">
                                    <span>Analytical</span>
                                    <span>Creative</span>
                                  </div>
                                  <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full mt-1">
                                    <div
                                      className="bg-gradient-to-r from-indigo-500 to-purple-500 h-1.5 rounded-full"
                                      style={{ width: `${bot.personality.analyticalCreative}%` }}
                                    />
                                  </div>
                                </div>
                                <div>
                                  <div className="flex justify-between">
                                    <span>Busy</span>
                                    <span>Free Time</span>
                                  </div>
                                  <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full mt-1">
                                    <div
                                      className="bg-gradient-to-r from-indigo-500 to-purple-500 h-1.5 rounded-full"
                                      style={{ width: `${bot.personality.busyFreeTime}%` }}
                                    />
                                  </div>
                                </div>
                                <div>
                                  <div className="flex justify-between">
                                    <span>Disorganized</span>
                                    <span>Organized</span>
                                  </div>
                                  <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full mt-1">
                                    <div
                                      className="bg-gradient-to-r from-indigo-500 to-purple-500 h-1.5 rounded-full"
                                      style={{ width: `${bot.personality.disorganizedOrganized}%` }}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>

                  <div className="flex justify-between mt-8">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        onClick={() => setActiveStep(1)}
                        variant="outline"
                        className="border-purple-200 dark:border-gray-700 hover:bg-purple-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Configuration
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        onClick={generateReviews}
                        className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white hover:opacity-90 transition-opacity"
                        disabled={isGeneratingReviews}
                      >
                        {isGeneratingReviews ? (
                          <>
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                              className="mr-2"
                            >
                              <Zap className="h-4 w-4" />
                            </motion.div>
                            Generating Reviews...
                          </>
                        ) : (
                          <>
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Generate Reviews
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </motion.div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Fase para ver las reseñas generadas */}
            {activeStep === 3 && (
              <Card className="border-purple-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10">
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-purple-500" />
                    Generated Reviews
                  </CardTitle>
                  <CardDescription>Reviews generated by bot profiles based on your configuration</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row gap-6 mb-6 pb-6 border-b border-purple-100 dark:border-gray-800">
                    <div className="flex-shrink-0">
                      <motion.img
                        src={product.image || "/placeholder.svg"}
                        alt={product.name}
                        className="h-32 w-32 object-contain rounded-md"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 260, damping: 20 }}
                      />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-1">{product.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{product.description}</p>
                      <p className="text-lg font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
                        {product.price}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Category: {product.category}</p>

                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => {
                          const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
                          return (
                            <motion.div
                              key={star}
                              initial={{ scale: 0, rotate: -30 }}
                              animate={{ scale: 1, rotate: 0 }}
                              transition={{ delay: star * 0.1, type: "spring" }}
                            >
                              <Star
                                className={`h-5 w-5 ${star <= Math.round(averageRating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300 dark:text-gray-600"}`}
                              />
                            </motion.div>
                          )
                        })}
                        <span className="ml-2 text-sm font-medium">
                          {reviews.length > 0
                            ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
                            : "0.0"}{" "}
                          out of 5
                        </span>
                        <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                          ({reviews.length} reviews)
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2">
                    {reviews.map((review, index) => {
                      const bot = bots.find((b) => b.id === review.botId)
                      return (
                        <motion.div
                          key={review.id}
                          className="border-b border-purple-100 dark:border-gray-800 pb-6 last:border-0"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Avatar className="h-8 w-8 border-2 border-purple-200 dark:border-gray-700">
                              <AvatarImage src={bot?.avatar} alt={bot?.name} />
                              <AvatarFallback
                                className={`${bot?.gender === "Male" ? "bg-gradient-to-br from-blue-500 to-indigo-500" : "bg-gradient-to-br from-pink-500 to-purple-500"} text-white flex items-center justify-center`}
                              >
                                {bot?.gender === "Male" ? (
                                  <MaleIcon className="h-4 w-4" />
                                ) : (
                                  <FemaleIcon className="h-4 w-4" />
                                )}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-gray-900 dark:text-gray-100">{bot?.name}</span>
                          </div>

                          <div className="flex items-center gap-1 mb-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-4 w-4 ${star <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300 dark:text-gray-600"}`}
                              />
                            ))}
                          </div>

                          <h4 className="font-semibold mb-1 text-gray-900 dark:text-gray-100">{review.title}</h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Reviewed on {review.date}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">{review.content}</p>

                          <div className="mt-2 text-sm text-gray-500 dark:text-gray-400 flex items-center">
                            <ThumbsUp className="h-3 w-3 mr-1" />
                            {review.helpfulVotes} people found this helpful
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>

                  <div className="flex justify-between mt-8">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        onClick={() => setActiveStep(2)}
                        variant="outline"
                        className="border-purple-200 dark:border-gray-700 hover:bg-purple-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Profiles
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        onClick={generateAnalysis}
                        className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white hover:opacity-90 transition-opacity"
                        disabled={isGeneratingAnalysis}
                      >
                        {isGeneratingAnalysis ? (
                          <>
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                              className="mr-2"
                            >
                              <Zap className="h-4 w-4" />
                            </motion.div>
                            Analyzing Reviews...
                          </>
                        ) : (
                          <>
                            <BarChart3 className="mr-2 h-4 w-4" />
                            Generate Dashboard
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </motion.div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Fase de dashboard con análisis */}
            {activeStep === 4 && analysisResult && (
              <div className="space-y-6">
                <Card className="border-purple-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10">
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-purple-500" />
                      Review Analysis Dashboard
                    </CardTitle>
                    <CardDescription>
                      Insights and analysis based on {reviews.length} reviews for {product.name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <Card className="border-purple-100 dark:border-gray-800">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                            Average Rating
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-center">
                            <div className="text-5xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
                              {analysisResult.averageRating.toFixed(1)}
                            </div>
                            <div className="text-xl text-gray-400 mt-2 ml-1">/5</div>
                          </div>
                          <div className="flex items-center justify-center mt-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-5 w-5 ${star <= Math.round(analysisResult.averageRating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300 dark:text-gray-600"}`}
                              />
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-purple-100 dark:border-gray-800">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <ThumbsUp className="h-5 w-5 text-green-500" />
                            Sentiment Analysis
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <SentimentPieChart />
                        </CardContent>
                      </Card>

                      <Card className="border-purple-100 dark:border-gray-800">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Users className="h-5 w-5 text-blue-500" />
                            Reviewer Demographics
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4">
                          <div className="space-y-2 text-sm">
                            <div>
                              <div className="flex justify-between mb-1">
                                <span className="text-gray-500 dark:text-gray-400">Age Range</span>
                                <span className="font-medium">
                                  {demographics.ageRange[0]}-{demographics.ageRange[1]} years
                                </span>
                              </div>
                              <Progress value={75} className="h-1.5" />
                            </div>
                            <div>
                              <div className="flex justify-between mb-1">
                                <span className="text-gray-500 dark:text-gray-400">Gender Ratio</span>
                                <span className="font-medium">
                                  {demographics.genderRatio}% M / {100 - demographics.genderRatio}% F
                                </span>
                              </div>
                              <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-blue-500 rounded-full"
                                  style={{ width: `${demographics.genderRatio}%` }}
                                />
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between mb-1">
                                <span className="text-gray-500 dark:text-gray-400">Education</span>
                                <span className="font-medium">
                                  {demographics.educationRange[0]}-{demographics.educationRange[1]} years
                                </span>
                              </div>
                              <Progress value={60} className="h-1.5" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <Card className="border-purple-100 dark:border-gray-800">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-indigo-500" />
                            Rating Distribution
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4">
                          <RatingBarChart distribution={analysisResult.ratingDistribution} />
                        </CardContent>
                      </Card>

                      <Card className="border-purple-100 dark:border-gray-800">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-purple-500" />
                            Keyword Analysis
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4">
                          <KeywordCloud keywords={analysisResult.keywordAnalysis} />
                        </CardContent>
                      </Card>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card className="border-purple-100 dark:border-gray-800 bg-green-50/50 dark:bg-green-900/20">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg flex items-center gap-2 text-green-600 dark:text-green-400">
                            <ThumbsUp className="h-5 w-5" />
                            Positive Points
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4">
                          <ul className="space-y-2">
                            {analysisResult.positivePoints.map((point, index) => (
                              <motion.li
                                key={index}
                                className="flex items-start gap-2 text-sm"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                              >
                                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                <span>{point}</span>
                              </motion.li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>

                      <Card className="border-purple-100 dark:border-gray-800 bg-red-50/50 dark:bg-red-900/20">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg flex items-center gap-2 text-red-600 dark:text-red-400">
                            <ThumbsDown className="h-5 w-5" />
                            Areas for Improvement
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4">
                          <ul className="space-y-2">
                            {analysisResult.negativePoints.map((point, index) => (
                              <motion.li
                                key={index}
                                className="flex items-start gap-2 text-sm"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                              >
                                <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                                <span>{point}</span>
                              </motion.li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="mt-6">
                      <Card className="border-purple-100 dark:border-gray-800">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Users className="h-5 w-5 text-purple-500" />
                            Demographic Insights
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {analysisResult.demographicInsights.map((insight, index) => (
                              <motion.div
                                key={index}
                                className="flex items-start gap-2"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                              >
                                {index % 2 === 0 ? (
                                  <TrendingUp className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                ) : (
                                  <TrendingDown className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                                )}
                                <span className="text-sm">{insight}</span>
                              </motion.div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </CardContent>
                  <CardFooter className="bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-pink-500/5 border-t border-purple-100 dark:border-gray-800 px-6 py-4">
                    <div className="flex justify-between w-full">
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          onClick={() => setActiveStep(3)}
                          variant="outline"
                          className="border-purple-200 dark:border-gray-700 hover:bg-purple-50 dark:hover:bg-gray-800 transition-colors"
                        >
                          <ArrowLeft className="mr-2 h-4 w-4" />
                          Back to Reviews
                        </Button>
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          onClick={() => {
                            setBots([])
                            setReviews([])
                            setAnalysisResult(null)
                            setActiveStep(1)
                          }}
                          className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white hover:opacity-90 transition-opacity"
                        >
                          <Rocket className="mr-2 h-4 w-4" />
                          Start New Simulation
                        </Button>
                      </motion.div>
                    </div>
                  </CardFooter>
                </Card>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

