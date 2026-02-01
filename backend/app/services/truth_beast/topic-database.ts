/**
 * Topic Database - Domain/Subject Classification
 * Separates WHAT we're talking about from HOW we express it
 *
 * Phase 1: Auto-populated from token registry semantic_patterns
 */

export interface Topic {
  id: string;                    // "physics_constants"
  name: string;                  // "Physical Constants"
  domain: string;                // "physics"
  keywords: string[];            // ["speed of light", "planck constant"]
  related_tokens: string[];      // ["PhysicalConstantTT", "UniversalTT"]
  verification_priority: number; // 0.0-1.0 (how critical to verify)
  description: string;           // What this topic covers
}

/**
 * Topic detection result
 */
export interface TopicMatch {
  topic: Topic;
  matched_keywords: string[];
  confidence: number;            // 0.0-1.0 based on keyword matches
}

/**
 * Domain categories for organization
 */
export enum Domain {
  PHYSICS = "physics",
  MATHEMATICS = "mathematics",
  CHEMISTRY = "chemistry",
  BIOLOGY = "biology",
  MEDICINE = "medicine",
  HISTORY = "history",
  LAW = "law",
  CULTURE = "culture",
  PSYCHOLOGY = "psychology",
  PHILOSOPHY = "philosophy",
  TECHNOLOGY = "technology",
  ECONOMICS = "economics",
  POLITICS = "politics",
  GEOGRAPHY = "geography",
  LINGUISTICS = "linguistics",
  ART = "art",
  RELIGION = "religion",
  SPORTS = "sports",
  GENERAL = "general"
}

/**
 * Auto-populated topic database
 * Extracted from token registry semantic_patterns
 */
export const TOPIC_DATABASE: Topic[] = [
  // ============================================
  // PHYSICS
  // ============================================
  {
    id: "physics_constants",
    name: "Physical Constants",
    domain: Domain.PHYSICS,
    keywords: [
      // Multi-word patterns (high specificity)
      "speed of light",
      "gravitational constant",
      "planck constant",
      "planck's constant",
      "avogadro constant",
      "avogadro's number",
      "boltzmann constant",
      "electron mass",
      "proton mass",
      "neutron mass",
      "fine structure constant",
      "vacuum permittivity",
      "elementary charge",
      "rydberg constant",
      "gas constant",
      // Contextual patterns (avoid false positives)
      "fundamental constant",
      "physical constant",
      "universal constant",
      "invariant constant"
      // REMOVED: Single letters "c", "G", "h" (too generic)
      // REMOVED: Standalone "planck", "avogadro", "boltzmann", "electron" (use multi-word)
      // REMOVED: "gravitational" (moved to mechanics where more appropriate)
    ],
    related_tokens: [
      "PhysicalConstantTT",
      "UniversalTT",  // Phase 2: Fixed - was UniversalFactTT
      "ScientificFactTT"
    ],
    verification_priority: 0.95,
    description: "Fundamental physical constants that are invariant"
  },
  {
    id: "physics_mechanics",
    name: "Classical Mechanics",
    domain: Domain.PHYSICS,
    keywords: [
      // Contextual physics terms (higher specificity)
      "newton's laws",
      "newtonian mechanics",
      "classical mechanics",
      "F=ma",
      "kinetic energy",
      "potential energy",
      "gravitational force",
      "gravitational field",
      "centripetal force",
      "centrifugal force",
      "angular momentum",
      "linear momentum",
      // Specific mechanical concepts
      "inertia",
      "friction",
      "acceleration",
      "velocity",
      "trajectory",
      "projectile motion",
      "free fall",
      "newton"  // Historical figure, less ambiguous
      // REMOVED: "force", "mass", "energy", "gravity" (too generic, match many contexts)
      // REMOVED: Standalone "kinetic", "potential" (now used with "energy")
    ],
    related_tokens: [
      "ScientificFactTT",
      "PhysicalConstantTT",
      "UniversalTT"  // Phase 2: Fixed - was UniversalFactTT
    ],
    verification_priority: 0.90,
    description: "Classical mechanics and motion"
  },
  {
    id: "physics_thermodynamics",
    name: "Thermodynamics",
    domain: Domain.PHYSICS,
    keywords: [
      "temperature",
      "heat",
      "entropy",
      "enthalpy",
      "thermodynamic",
      "first law",
      "second law",
      "absolute zero",
      "kelvin",
      "celsius",
      "fahrenheit"
    ],
    related_tokens: [
      "ScientificFactTT",
      "PhysicalConstantTT",
      "UniversalTT"
    ],
    verification_priority: 0.90,
    description: "Heat, energy, and thermodynamic processes"
  },
  {
    id: "physics_quantum",
    name: "Quantum Mechanics",
    domain: Domain.PHYSICS,
    keywords: [
      "quantum",
      "qubit",
      "superposition",
      "entanglement",
      "wave function",
      "schrodinger",
      "heisenberg",
      "uncertainty principle",
      "planck",
      "photon",
      "electron orbital"
    ],
    related_tokens: [
      "ScientificFactTT",
      "PhysicalConstantTT",
      "ProbabilisticTT"
    ],
    verification_priority: 0.92,
    description: "Quantum physics and subatomic phenomena"
  },
  {
    id: "physics_nuclear",
    name: "Nuclear Physics",
    domain: Domain.PHYSICS,
    keywords: [
      "thermonuclear",
      "nuclear",
      "fusion",
      "fission",
      "radioactive",
      "decay",
      "isotope",
      "deuterium",
      "tritium",
      "uranium",
      "plutonium",
      "reactor"
    ],
    related_tokens: [
      "ScientificFactTT",
      "PhysicalConstantTT",
      "HistoricalEventTT"
    ],
    verification_priority: 0.95,
    description: "Nuclear reactions and radioactivity"
  },
  {
    id: "physics_relativity",
    name: "Relativity",
    domain: Domain.PHYSICS,
    keywords: [
      "relativity",
      "einstein",
      "E=mc²",
      "spacetime",
      "time dilation",
      "length contraction",
      "special relativity",
      "general relativity",
      "schwarzschild",
      "lorentz"
    ],
    related_tokens: [
      "ScientificFactTT",
      "PhysicalConstantTT",
      "UniversalTT"
    ],
    verification_priority: 0.94,
    description: "Special and general relativity"
  },

  // ============================================
  // MATHEMATICS
  // ============================================
  {
    id: "math_arithmetic",
    name: "Arithmetic",
    domain: Domain.MATHEMATICS,
    keywords: [
      // Contextual arithmetic patterns (multi-word preferred)
      "basic arithmetic",
      "arithmetic operation",
      "addition and subtraction",
      "multiplication and division",
      // Explicit arithmetic examples
      "2+2",
      "1+1",
      "5+3",
      "10-5",
      // Specific arithmetic terms
      "addend",
      "subtrahend",
      "multiplicand",
      "dividend",
      "divisor",
      "quotient",
      "remainder",
      "carry over",
      "borrowing"
      // REMOVED: "add", "subtract", "multiply", "divide" (too generic - appear in non-math contexts)
      // REMOVED: "plus", "minus", "times", "sum", "product", "difference" (very common words)
    ],
    related_tokens: [
      "MathematicalTT",
      "NumericalTT",
      "UniversalTT"
    ],
    verification_priority: 0.99,
    description: "Basic arithmetic operations"
  },
  {
    id: "math_algebra",
    name: "Algebra",
    domain: Domain.MATHEMATICS,
    keywords: [
      // Multi-word algebraic terms (higher specificity)
      "algebraic equation",
      "linear equation",
      "quadratic equation",
      "polynomial equation",
      "quadratic formula",
      "factoring polynomials",
      "solving equations",
      "system of equations",
      // Specific algebraic concepts
      "polynomial",
      "quadratic",
      "binomial",
      "trinomial",
      "exponent",
      "logarithm",
      "exponential",
      "square root",
      "radical",
      "coefficient",
      "algebraic expression"
      // REMOVED: "x", "y" (single letters match everything)
      // REMOVED: "equation", "variable", "solve" (too generic, appear in many contexts)
      // REMOVED: Standalone "linear" (ambiguous without context)
    ],
    related_tokens: [
      "MathematicalTT",
      "LogicalTT",
      "UniversalTT"
    ],
    verification_priority: 0.97,
    description: "Algebraic equations and operations"
  },
  {
    id: "math_geometry",
    name: "Geometry",
    domain: Domain.MATHEMATICS,
    keywords: [
      // Multi-word geometric patterns
      "geometric shape",
      "geometric shapes",
      "euclidean geometry",
      "pythagorean theorem",
      "parallel lines",
      "perpendicular lines",
      "right angle",
      "acute angle",
      "obtuse angle",
      "surface area",
      "area of",  // "area of a circle", "area of a triangle"
      "volume of",  // "volume of a sphere"
      // Specific geometric terms
      "triangle",
      "equilateral",
      "isosceles",
      "rectangle",
      "polygon",
      "hexagon",
      "pentagon",
      "perimeter",
      "circumference",
      "diameter",
      "radius",
      "hypotenuse",
      "pythagoras",
      "euclidean"
      // REMOVED: Standalone "circle", "square", "angle", "area", "volume" (too generic)
      // REMOVED: Standalone "perpendicular", "parallel" (now with "lines")
    ],
    related_tokens: [
      "MathematicalTT",
      "UniversalTT",
      "AxiomaticTT"
    ],
    verification_priority: 0.96,
    description: "Geometric shapes and spatial relationships"
  },
  {
    id: "math_calculus",
    name: "Calculus",
    domain: Domain.MATHEMATICS,
    keywords: [
      "derivative",
      "integral",
      "limit",
      "differential",
      "calculus",
      "newton",
      "leibniz",
      "slope",
      "rate of change",
      "antiderivative"
    ],
    related_tokens: [
      "MathematicalTT",
      "ScientificFactTT",
      "UniversalTT"
    ],
    verification_priority: 0.94,
    description: "Differential and integral calculus"
  },

  // ============================================
  // HISTORY
  // ============================================
  {
    id: "history_american_revolution",
    name: "American Revolution",
    domain: Domain.HISTORY,
    keywords: [
      "american revolution",
      "1776",
      "independence",
      "declaration",
      "washington",
      "jefferson",
      "colonies",
      "british",
      "revolutionary war"
    ],
    related_tokens: [
      "HistoricalEventTT",
      "DateTT",
      "GeographicalTT"
    ],
    verification_priority: 0.85,
    description: "American Revolutionary War and independence"
  },
  {
    id: "history_world_war_2",
    name: "World War II",
    domain: Domain.HISTORY,
    keywords: [
      "world war ii",
      "ww2",
      "wwii",
      "hitler",
      "nazi",
      "holocaust",
      "pearl harbor",
      "d-day",
      "1939",
      "1945",
      "atomic bomb"
    ],
    related_tokens: [
      "HistoricalEventTT",
      "DateTT",
      "GeographicalTT"
    ],
    verification_priority: 0.90,
    description: "World War II events and history"
  },

  // ============================================
  // MEDICINE & BIOLOGY
  // ============================================
  {
    id: "medicine_anatomy",
    name: "Human Anatomy",
    domain: Domain.MEDICINE,
    keywords: [
      "heart",
      "brain",
      "lung",
      "liver",
      "kidney",
      "organ",
      "muscle",
      "bone",
      "blood",
      "artery",
      "vein",
      "nerve"
    ],
    related_tokens: [
      "MedicalFactTT",
      "ScientificFactTT",
      "UniversalTT"
    ],
    verification_priority: 0.92,
    description: "Human body anatomy and physiology"
  },
  {
    id: "biology_evolution",
    name: "Evolution",
    domain: Domain.BIOLOGY,
    keywords: [
      "evolution",
      "darwin",
      "natural selection",
      "species",
      "adaptation",
      "mutation",
      "genetic",
      "survival of the fittest",
      "common ancestor"
    ],
    related_tokens: [
      "ScientificFactTT",
      "HistoricalEventTT",
      "ProbabilisticTT"
    ],
    verification_priority: 0.88,
    description: "Theory of evolution and natural selection"
  },
  {
    id: "biology_genetics",
    name: "Genetics",
    domain: Domain.BIOLOGY,
    keywords: [
      "dna",
      "rna",
      "gene",
      "chromosome",
      "genome",
      "genetic",
      "heredity",
      "allele",
      "mutation",
      "crispr"
    ],
    related_tokens: [
      "ScientificFactTT",
      "MedicalFactTT",
      "UniversalTT"
    ],
    verification_priority: 0.93,
    description: "Genetics and heredity"
  },

  // ============================================
  // LAW & POLITICS
  // ============================================
  {
    id: "law_constitutional",
    name: "Constitutional Law",
    domain: Domain.LAW,
    keywords: [
      "constitution",
      "amendment",
      "first amendment",
      "second amendment",
      "bill of rights",
      "supreme court",
      "constitutional",
      "unconstitutional"
    ],
    related_tokens: [
      "LegalFactTT",
      "HistoricalEventTT",
      "InstitutionalTT"
    ],
    verification_priority: 0.91,
    description: "Constitutional law and amendments"
  },

  // ============================================
  // CULTURE & LANGUAGE
  // ============================================
  {
    id: "culture_traditions",
    name: "Cultural Traditions",
    domain: Domain.CULTURE,
    keywords: [
      "tradition",
      "custom",
      "ritual",
      "ceremony",
      "festival",
      "celebration",
      "cultural",
      "heritage",
      "folklore"
    ],
    related_tokens: [
      "CulturalNormTT",
      "HistoricalEventTT",
      "ContextualTT"
    ],
    verification_priority: 0.60,
    description: "Cultural practices and traditions"
  },

  // ============================================
  // PHILOSOPHY & RELIGION
  // ============================================
  {
    id: "philosophy_ethics",
    name: "Ethics & Morality",
    domain: Domain.PHILOSOPHY,
    keywords: [
      "moral",
      "ethical",
      "right",
      "wrong",
      "duty",
      "ought",
      "virtue",
      "justice",
      "good",
      "evil"
    ],
    related_tokens: [
      "EthicalTT",
      "PhilosophicalTT",
      "SubjectiveTT"
    ],
    verification_priority: 0.50,
    description: "Ethics, morality, and moral philosophy"
  },
  {
    id: "philosophy_logic",
    name: "Logic & Reasoning",
    domain: Domain.PHILOSOPHY,
    keywords: [
      "logic",
      "reason",
      "argument",
      "premise",
      "conclusion",
      "valid",
      "invalid",
      "sound",
      "fallacy",
      "syllogism"
    ],
    related_tokens: [
      "LogicalTT",
      "PhilosophicalTT",
      "UniversalTT"
    ],
    verification_priority: 0.85,
    description: "Logical reasoning and argumentation"
  },

  // ============================================
  // GENERAL / META
  // ============================================
  {
    id: "general_ai_systems",
    name: "AI Systems",
    domain: Domain.TECHNOLOGY,
    keywords: [
      // Multi-word AI patterns (higher specificity)
      "artificial intelligence",
      "machine learning",
      "deep learning",
      "neural network",
      "neural networks",
      "ai model",
      "ai system",
      "ml model",
      "language model",
      "large language model",
      "llm",
      "training data",
      "model training",
      // Specific AI systems/concepts
      "gpt",
      "chatgpt",
      "claude",
      "chatbot",
      "transformer",
      "backpropagation",
      "gradient descent",
      "supervised learning",
      "unsupervised learning",
      "reinforcement learning",
      "computer vision",
      "natural language processing",
      "nlp"
      // REMOVED: Standalone "ai" (matches "said", "wait", "pain", etc.)
      // REMOVED: Standalone "model" (too generic - fashion/business/role model)
    ],
    related_tokens: [
      "MetaSystemTT",
      "MetaCapabilityTT",
      "TechnicalTT"
    ],
    verification_priority: 0.70,
    description: "Artificial intelligence and machine learning systems"
  },

  // ============================================
  // MEDICINE & HEALTH (Phase 3 Expansion)
  // ============================================
  {
    id: "medicine_diseases",
    name: "Diseases & Conditions",
    domain: Domain.MEDICINE,
    keywords: [
      "disease",
      "illness",
      "condition",
      "syndrome",
      "disorder",
      "infection",
      "cancer",
      "diabetes",
      "hypertension",
      "alzheimer",
      "parkinson",
      "arthritis",
      "asthma",
      "copd",
      "hiv",
      "aids",
      "covid",
      "influenza",
      "pneumonia",
      "tuberculosis"
    ],
    related_tokens: [
      "MedicalFactTT",
      "ScientificFactTT",
      "HistoricalTT"
    ],
    verification_priority: 0.95,
    description: "Medical diseases, illnesses, and health conditions"
  },
  {
    id: "medicine_treatments",
    name: "Medical Treatments",
    domain: Domain.MEDICINE,
    keywords: [
      "treatment",
      "therapy",
      "medication",
      "drug",
      "medicine",
      "prescription",
      "antibiotic",
      "chemotherapy",
      "radiation",
      "surgery",
      "operation",
      "transplant",
      "dialysis",
      "immunotherapy"
    ],
    related_tokens: [
      "MedicalFactTT",
      "ScientificFactTT",
      "ProcedureTT"
    ],
    verification_priority: 0.95,
    description: "Medical treatments, therapies, and interventions"
  },
  {
    id: "medicine_pharmacology",
    name: "Pharmacology",
    domain: Domain.MEDICINE,
    keywords: [
      "pharmacology",
      "pharmaceutical",
      "drug interaction",
      "dosage",
      "side effect",
      "adverse reaction",
      "contraindication",
      "metabolism",
      "absorption",
      "excretion",
      "half-life",
      "bioavailability"
    ],
    related_tokens: [
      "MedicalFactTT",
      "ScientificFactTT",
      "ChemicalTT"
    ],
    verification_priority: 0.95,
    description: "Drug actions, interactions, and pharmacological principles"
  },
  {
    id: "medicine_diagnostics",
    name: "Medical Diagnostics",
    domain: Domain.MEDICINE,
    keywords: [
      "diagnosis",
      "diagnostic",
      "test",
      "screening",
      "biopsy",
      "blood test",
      "mri",
      "ct scan",
      "x-ray",
      "ultrasound",
      "ecg",
      "ekg",
      "lab results",
      "pathology"
    ],
    related_tokens: [
      "MedicalFactTT",
      "ProcedureTT",
      "MeasuredTT"
    ],
    verification_priority: 0.90,
    description: "Medical diagnostic tests and procedures"
  },
  {
    id: "medicine_mental_health",
    name: "Mental Health",
    domain: Domain.MEDICINE,
    keywords: [
      "mental health",
      "psychiatry",
      "psychology",
      "depression",
      "anxiety",
      "bipolar",
      "schizophrenia",
      "ptsd",
      "ocd",
      "adhd",
      "autism",
      "therapy",
      "counseling",
      "psychotherapy"
    ],
    related_tokens: [
      "MedicalFactTT",
      "PsychologicalTT",
      "ContextualTT"
    ],
    verification_priority: 0.85,
    description: "Mental health conditions and psychiatric care"
  },
  {
    id: "medicine_nutrition",
    name: "Nutrition & Diet",
    domain: Domain.MEDICINE,
    keywords: [
      "nutrition",
      "diet",
      "vitamin",
      "mineral",
      "nutrient",
      "protein",
      "carbohydrate",
      "fat",
      "calorie",
      "metabolism",
      "dietary",
      "supplement",
      "deficiency",
      "malnutrition"
    ],
    related_tokens: [
      "MedicalFactTT",
      "ScientificFactTT",
      "BiologicalTT"
    ],
    verification_priority: 0.85,
    description: "Nutrition science, dietary requirements, and metabolism"
  },
  {
    id: "medicine_vaccines",
    name: "Vaccines & Immunology",
    domain: Domain.MEDICINE,
    keywords: [
      "vaccine",
      "vaccination",
      "immunization",
      "antibody",
      "antigen",
      "immune system",
      "immunity",
      "immunology",
      "booster",
      "inoculation",
      "herd immunity"
    ],
    related_tokens: [
      "MedicalFactTT",
      "ScientificFactTT",
      "BiologicalTT"
    ],
    verification_priority: 0.95,
    description: "Vaccines, immunization, and immune system function"
  },
  {
    id: "medicine_procedures",
    name: "Medical Procedures",
    domain: Domain.MEDICINE,
    keywords: [
      "procedure",
      "surgery",
      "operation",
      "biopsy",
      "endoscopy",
      "catheterization",
      "intubation",
      "resuscitation",
      "cpr",
      "anesthesia",
      "suture",
      "incision"
    ],
    related_tokens: [
      "MedicalFactTT",
      "ProcedureTT",
      "TechnicalTT"
    ],
    verification_priority: 0.90,
    description: "Medical and surgical procedures"
  },

  // ============================================
  // TECHNOLOGY & COMPUTING (Phase 3 Expansion)
  // ============================================
  {
    id: "tech_programming",
    name: "Programming Languages",
    domain: Domain.TECHNOLOGY,
    keywords: [
      // Multi-word programming patterns (higher specificity)
      "programming language",
      "programming languages",
      "source code",
      "code syntax",
      "write code",
      "coding in",
      // Specific language names
      "python",
      "javascript",
      "typescript",
      "java",
      "c++",
      "c#",
      "rust",
      "golang",  // "go" language - use "golang" to avoid ambiguity
      "ruby",
      "php",
      "swift",
      "kotlin",
      "scala",
      "haskell",
      // Programming concepts
      "compiler",
      "interpreter",
      "bytecode",
      "syntax error",
      "runtime"
      // REMOVED: Standalone "code", "programming", "syntax", "go" (too generic/ambiguous)
    ],
    related_tokens: [
      "TechnicalTT",
      "LogicalTT",
      "ProcedureTT"
    ],
    verification_priority: 0.80,
    description: "Programming languages and coding concepts"
  },
  {
    id: "tech_web_development",
    name: "Web Development",
    domain: Domain.TECHNOLOGY,
    keywords: [
      // Multi-word web development patterns
      "web development",
      "web developer",
      "web application",
      "web app",
      "frontend development",
      "backend development",
      "full stack",
      "rest api",
      "restful api",
      "web server",
      "http request",
      "http response",
      "web browser",
      "browser rendering",
      // Specific web technologies
      "html",
      "css",
      "javascript",
      "graphql",
      "http",
      "https",
      "dom",
      "react",
      "vue",
      "angular",
      "node.js",
      "express",
      "django",
      "flask"
      // REMOVED: Standalone "api", "rest", "server", "client", "browser" (too generic)
      // REMOVED: "frontend", "backend" without context (now "frontend development", etc.)
    ],
    related_tokens: [
      "TechnicalTT",
      "ProcedureTT",
      "ProtocolTT"
    ],
    verification_priority: 0.75,
    description: "Web development technologies and frameworks"
  },
  {
    id: "tech_databases",
    name: "Database Systems",
    domain: Domain.TECHNOLOGY,
    keywords: [
      "database",
      "sql",
      "nosql",
      "query",
      "table",
      "index",
      "transaction",
      "acid",
      "mongodb",
      "postgresql",
      "mysql",
      "redis",
      "schema",
      "normalization"
    ],
    related_tokens: [
      "TechnicalTT",
      "LogicalTT",
      "StructuralTT"
    ],
    verification_priority: 0.80,
    description: "Database management systems and data storage"
  },
  {
    id: "tech_cloud_computing",
    name: "Cloud Computing",
    domain: Domain.TECHNOLOGY,
    keywords: [
      "cloud",
      "aws",
      "azure",
      "gcp",
      "saas",
      "paas",
      "iaas",
      "serverless",
      "container",
      "docker",
      "kubernetes",
      "microservices",
      "scalability"
    ],
    related_tokens: [
      "TechnicalTT",
      "ArchitecturalTT",
      "SystemTT"
    ],
    verification_priority: 0.75,
    description: "Cloud computing platforms and architectures"
  },
  {
    id: "tech_cybersecurity",
    name: "Cybersecurity",
    domain: Domain.TECHNOLOGY,
    keywords: [
      "security",
      "cybersecurity",
      "encryption",
      "authentication",
      "authorization",
      "firewall",
      "malware",
      "virus",
      "hacking",
      "vulnerability",
      "penetration testing",
      "ssl",
      "tls",
      "vpn"
    ],
    related_tokens: [
      "TechnicalTT",
      "SecurityTT",
      "RiskTT"
    ],
    verification_priority: 0.90,
    description: "Computer security and information protection"
  },
  {
    id: "tech_networking",
    name: "Computer Networks",
    domain: Domain.TECHNOLOGY,
    keywords: [
      "network",
      "networking",
      "tcp",
      "ip",
      "protocol",
      "router",
      "switch",
      "bandwidth",
      "latency",
      "packet",
      "dns",
      "dhcp",
      "subnet",
      "gateway"
    ],
    related_tokens: [
      "TechnicalTT",
      "ProtocolTT",
      "SystemTT"
    ],
    verification_priority: 0.80,
    description: "Computer networking and communication protocols"
  },
  {
    id: "tech_devops",
    name: "DevOps & CI/CD",
    domain: Domain.TECHNOLOGY,
    keywords: [
      "devops",
      "ci/cd",
      "continuous integration",
      "deployment",
      "jenkins",
      "gitlab",
      "github actions",
      "pipeline",
      "automation",
      "infrastructure as code",
      "monitoring",
      "logging"
    ],
    related_tokens: [
      "TechnicalTT",
      "ProcedureTT",
      "SystemTT"
    ],
    verification_priority: 0.70,
    description: "DevOps practices and continuous integration/deployment"
  },
  {
    id: "tech_blockchain",
    name: "Blockchain & Crypto",
    domain: Domain.TECHNOLOGY,
    keywords: [
      // Multi-word blockchain patterns
      "blockchain",
      "blockchain technology",
      "cryptocurrency",
      "crypto currency",
      "smart contract",
      "smart contracts",
      "distributed ledger",
      "consensus algorithm",
      "proof of work",
      "proof of stake",
      "crypto mining",
      "bitcoin mining",
      "cryptographic hash",
      "hash function",
      "decentralized network",
      "decentralized system",
      // Specific cryptocurrencies/platforms
      "bitcoin",
      "ethereum",
      "web3",
      "nft",
      "nfts",
      "defi",
      "solidity",
      "merkle tree"
      // REMOVED: Standalone "consensus", "mining", "hash", "decentralized" (too generic)
    ],
    related_tokens: [
      "TechnicalTT",
      "CryptographicTT",
      "EconomicTT"
    ],
    verification_priority: 0.75,
    description: "Blockchain technology and cryptocurrencies"
  },

  // ============================================
  // ECONOMICS & FINANCE (Phase 3 Expansion)
  // ============================================
  {
    id: "economics_macro",
    name: "Macroeconomics",
    domain: Domain.ECONOMICS,
    keywords: [
      "macroeconomics",
      "gdp",
      "inflation",
      "deflation",
      "recession",
      "unemployment",
      "fiscal policy",
      "monetary policy",
      "central bank",
      "interest rate",
      "economic growth"
    ],
    related_tokens: [
      "EconomicTT",
      "StatisticalTT",
      "PolicyTT"
    ],
    verification_priority: 0.85,
    description: "Macroeconomic theory and national economic indicators"
  },
  {
    id: "economics_markets",
    name: "Financial Markets",
    domain: Domain.ECONOMICS,
    keywords: [
      "stock market",
      "bond",
      "equity",
      "trading",
      "investor",
      "portfolio",
      "nasdaq",
      "dow jones",
      "s&p 500",
      "commodity",
      "forex",
      "derivatives",
      "options",
      "futures"
    ],
    related_tokens: [
      "EconomicTT",
      "TradingTT",
      "StatisticalTT"
    ],
    verification_priority: 0.80,
    description: "Financial markets and investment instruments"
  },
  {
    id: "economics_trade",
    name: "International Trade",
    domain: Domain.ECONOMICS,
    keywords: [
      "trade",
      "export",
      "import",
      "tariff",
      "trade deficit",
      "trade surplus",
      "globalization",
      "wto",
      "free trade",
      "protectionism",
      "trade agreement"
    ],
    related_tokens: [
      "EconomicTT",
      "PolicyTT",
      "InternationalTT"
    ],
    verification_priority: 0.80,
    description: "International trade and global commerce"
  },
  {
    id: "economics_banking",
    name: "Banking & Finance",
    domain: Domain.ECONOMICS,
    keywords: [
      "bank",
      "banking",
      "loan",
      "credit",
      "mortgage",
      "savings",
      "checking account",
      "deposit",
      "withdrawal",
      "interest",
      "federal reserve",
      "commercial bank"
    ],
    related_tokens: [
      "EconomicTT",
      "InstitutionalTT",
      "FinancialTT"
    ],
    verification_priority: 0.85,
    description: "Banking systems and financial institutions"
  },
  {
    id: "economics_theory",
    name: "Economic Theory",
    domain: Domain.ECONOMICS,
    keywords: [
      "supply and demand",
      "market equilibrium",
      "elasticity",
      "opportunity cost",
      "comparative advantage",
      "marginal utility",
      "adam smith",
      "keynesian",
      "monetarism",
      "capitalism",
      "socialism"
    ],
    related_tokens: [
      "EconomicTT",
      "TheoryTT",
      "PhilosophicalTT"
    ],
    verification_priority: 0.75,
    description: "Economic theories and fundamental principles"
  },

  // ============================================
  // GEOGRAPHY & EARTH SCIENCE (Phase 3)
  // ============================================
  {
    id: "geography_countries",
    name: "Countries & Capitals",
    domain: Domain.GEOGRAPHY,
    keywords: [
      "country",
      "nation",
      "capital",
      "city",
      "border",
      "territory",
      "sovereign",
      "united states",
      "china",
      "india",
      "russia",
      "brazil",
      "europe",
      "asia",
      "africa"
    ],
    related_tokens: [
      "GeographicalTT",
      "PoliticalTT",
      "FactualTT"
    ],
    verification_priority: 0.90,
    description: "Countries, capitals, and political geography"
  },
  {
    id: "geography_physical",
    name: "Physical Geography",
    domain: Domain.GEOGRAPHY,
    keywords: [
      "mountain",
      "river",
      "ocean",
      "sea",
      "lake",
      "desert",
      "forest",
      "plain",
      "plateau",
      "valley",
      "peninsula",
      "island",
      "continent",
      "landform"
    ],
    related_tokens: [
      "GeographicalTT",
      "NaturalTT",
      "DescriptiveTT"
    ],
    verification_priority: 0.85,
    description: "Physical features and landforms"
  },
  {
    id: "geography_climate",
    name: "Climate & Weather",
    domain: Domain.GEOGRAPHY,
    keywords: [
      "climate",
      "weather",
      "temperature",
      "precipitation",
      "humidity",
      "tropical",
      "temperate",
      "arid",
      "polar",
      "monsoon",
      "season",
      "storm",
      "hurricane",
      "tornado"
    ],
    related_tokens: [
      "GeographicalTT",
      "MeteorologyTT",
      "ScientificFactTT"
    ],
    verification_priority: 0.85,
    description: "Climate patterns and weather phenomena"
  },
  {
    id: "geography_population",
    name: "Demographics & Population",
    domain: Domain.GEOGRAPHY,
    keywords: [
      "population",
      "demographic",
      "census",
      "birth rate",
      "death rate",
      "migration",
      "urbanization",
      "density",
      "age distribution",
      "life expectancy"
    ],
    related_tokens: [
      "GeographicalTT",
      "StatisticalTT",
      "SocialTT"
    ],
    verification_priority: 0.80,
    description: "Population statistics and demographic data"
  },
  {
    id: "geography_resources",
    name: "Natural Resources",
    domain: Domain.GEOGRAPHY,
    keywords: [
      "natural resource",
      "mineral",
      "oil",
      "gas",
      "coal",
      "renewable",
      "non-renewable",
      "mining",
      "extraction",
      "fossil fuel",
      "water resource",
      "timber"
    ],
    related_tokens: [
      "GeographicalTT",
      "EconomicTT",
      "EnvironmentalTT"
    ],
    verification_priority: 0.85,
    description: "Natural resources and their distribution"
  },

  // ============================================
  // LEGAL & LAW (Phase 3 Expansion)
  // ============================================
  {
    id: "law_criminal",
    name: "Criminal Law",
    domain: Domain.LAW,
    keywords: [
      "criminal",
      "crime",
      "felony",
      "misdemeanor",
      "murder",
      "theft",
      "assault",
      "fraud",
      "prosecution",
      "defense",
      "guilty",
      "innocent",
      "sentence",
      "jail",
      "prison"
    ],
    related_tokens: [
      "LegalFactTT",
      "JudicialTT",
      "PunitivityTT"
    ],
    verification_priority: 0.90,
    description: "Criminal law and justice system"
  },
  {
    id: "law_civil",
    name: "Civil Law",
    domain: Domain.LAW,
    keywords: [
      "civil",
      "lawsuit",
      "plaintiff",
      "defendant",
      "tort",
      "negligence",
      "damages",
      "liability",
      "settlement",
      "litigation",
      "dispute"
    ],
    related_tokens: [
      "LegalFactTT",
      "JudicialTT",
      "DisputeTT"
    ],
    verification_priority: 0.85,
    description: "Civil law and private disputes"
  },
  {
    id: "law_contract",
    name: "Contract Law",
    domain: Domain.LAW,
    keywords: [
      "contract",
      "agreement",
      "terms",
      "breach",
      "consideration",
      "offer",
      "acceptance",
      "binding",
      "obligation",
      "enforcement",
      "remedies"
    ],
    related_tokens: [
      "LegalFactTT",
      "AgreementTT",
      "ObligationTT"
    ],
    verification_priority: 0.85,
    description: "Contract formation and enforcement"
  },
  {
    id: "law_property",
    name: "Property Law",
    domain: Domain.LAW,
    keywords: [
      "property",
      "ownership",
      "title",
      "deed",
      "real estate",
      "lease",
      "rental",
      "landlord",
      "tenant",
      "easement",
      "zoning",
      "eminent domain"
    ],
    related_tokens: [
      "LegalFactTT",
      "OwnershipTT",
      "RightsTT"
    ],
    verification_priority: 0.85,
    description: "Property rights and real estate law"
  },
  {
    id: "law_intellectual_property",
    name: "Intellectual Property",
    domain: Domain.LAW,
    keywords: [
      "intellectual property",
      "patent",
      "copyright",
      "trademark",
      "trade secret",
      "infringement",
      "licensing",
      "royalty",
      "fair use"
    ],
    related_tokens: [
      "LegalFactTT",
      "OwnershipTT",
      "CreativeTT"
    ],
    verification_priority: 0.85,
    description: "Intellectual property rights and protection"
  },

  // ============================================
  // ENHANCED PHYSICS (Phase 3 Expansion)
  // ============================================
  {
    id: "physics_electromagnetism",
    name: "Electromagnetism",
    domain: Domain.PHYSICS,
    keywords: [
      "electromagnetic",
      "electric field",
      "magnetic field",
      "charge",
      "current",
      "voltage",
      "resistance",
      "capacitor",
      "inductor",
      "maxwell equations",
      "coulomb law",
      "ampere",
      "ohm"
    ],
    related_tokens: [
      "ScientificFactTT",
      "PhysicalConstantTT",
      "UniversalTT"
    ],
    verification_priority: 0.92,
    description: "Electromagnetic theory and electrical phenomena"
  },
  {
    id: "physics_optics",
    name: "Optics",
    domain: Domain.PHYSICS,
    keywords: [
      "light",
      "optics",
      "refraction",
      "reflection",
      "lens",
      "mirror",
      "diffraction",
      "interference",
      "wavelength",
      "frequency",
      "spectrum",
      "photon"
    ],
    related_tokens: [
      "ScientificFactTT",
      "PhysicalConstantTT",
      "WaveTT"
    ],
    verification_priority: 0.90,
    description: "Light and optical phenomena"
  },
  {
    id: "physics_acoustics",
    name: "Acoustics",
    domain: Domain.PHYSICS,
    keywords: [
      "sound",
      "acoustic",
      "wave",
      "frequency",
      "amplitude",
      "decibel",
      "ultrasound",
      "resonance",
      "echo",
      "doppler effect"
    ],
    related_tokens: [
      "ScientificFactTT",
      "PhysicalConstantTT",
      "WaveTT"
    ],
    verification_priority: 0.88,
    description: "Sound and acoustic phenomena"
  },

  // ============================================
  // ENHANCED MATHEMATICS (Phase 3 Expansion)
  // ============================================
  {
    id: "math_statistics",
    name: "Statistics",
    domain: Domain.MATHEMATICS,
    keywords: [
      // Multi-word statistical patterns
      "statistics",
      "statistical analysis",
      "probability distribution",
      "normal distribution",
      "binomial distribution",
      "standard deviation",
      "sample mean",
      "population mean",
      "mean and median",
      "median value",
      "hypothesis test",
      "hypothesis testing",
      "null hypothesis",
      "statistical significance",
      "confidence interval",
      "correlation coefficient",
      "linear regression",
      "regression analysis",
      // Specific statistical terms
      "variance",
      "covariance",
      "percentile",
      "quartile",
      "z-score",
      "p-value",
      "chi-square",
      "anova",
      "bayesian"
      // REMOVED: Standalone "mean", "median", "mode", "distribution" (ambiguous)
      // REMOVED: Standalone "probability", "correlation", "regression" (now with context)
    ],
    related_tokens: [
      "MathematicalTT",
      "StatisticalTT",
      "ProbabilisticTT"
    ],
    verification_priority: 0.94,
    description: "Statistical analysis and probability theory"
  },
  {
    id: "math_trigonometry",
    name: "Trigonometry",
    domain: Domain.MATHEMATICS,
    keywords: [
      "trigonometry",
      "sine",
      "cosine",
      "tangent",
      "angle",
      "radian",
      "degree",
      "triangle",
      "trig function",
      "unit circle"
    ],
    related_tokens: [
      "MathematicalTT",
      "GeometricTT",
      "UniversalTT"
    ],
    verification_priority: 0.95,
    description: "Trigonometric functions and relationships"
  },
  {
    id: "math_number_theory",
    name: "Number Theory",
    domain: Domain.MATHEMATICS,
    keywords: [
      "number theory",
      "prime number",
      "integer",
      "divisibility",
      "factor",
      "greatest common divisor",
      "modular arithmetic",
      "fibonacci",
      "perfect number"
    ],
    related_tokens: [
      "MathematicalTT",
      "LogicalTT",
      "UniversalTT"
    ],
    verification_priority: 0.93,
    description: "Properties of integers and number systems"
  },

  // ============================================
  // ENHANCED BIOLOGY (Phase 3 Expansion)
  // ============================================
  {
    id: "biology_microbiology",
    name: "Microbiology",
    domain: Domain.BIOLOGY,
    keywords: [
      "microorganism",
      "bacteria",
      "virus",
      "fungus",
      "microbe",
      "pathogen",
      "infection",
      "antibiotic resistance",
      "cell culture"
    ],
    related_tokens: [
      "ScientificFactTT",
      "BiologicalTT",
      "MedicalFactTT"
    ],
    verification_priority: 0.92,
    description: "Microscopic organisms and microbial life"
  },
  {
    id: "biology_ecology",
    name: "Ecology",
    domain: Domain.BIOLOGY,
    keywords: [
      "ecology",
      "ecosystem",
      "habitat",
      "biodiversity",
      "food chain",
      "predator",
      "prey",
      "symbiosis",
      "population",
      "community",
      "niche"
    ],
    related_tokens: [
      "ScientificFactTT",
      "BiologicalTT",
      "EnvironmentalTT"
    ],
    verification_priority: 0.88,
    description: "Interactions between organisms and environments"
  },
  {
    id: "biology_botany",
    name: "Botany",
    domain: Domain.BIOLOGY,
    keywords: [
      "plant",
      "botany",
      "photosynthesis",
      "chlorophyll",
      "leaf",
      "root",
      "stem",
      "flower",
      "seed",
      "pollination",
      "germination"
    ],
    related_tokens: [
      "ScientificFactTT",
      "BiologicalTT",
      "NaturalTT"
    ],
    verification_priority: 0.87,
    description: "Plant biology and botanical sciences"
  },

  // ============================================
  // ENVIRONMENTAL SCIENCE (Phase 3 Expansion)
  // ============================================
  {
    id: "environment_climate_change",
    name: "Climate Change",
    domain: Domain.GEOGRAPHY,
    keywords: [
      "climate change",
      "global warming",
      "greenhouse gas",
      "carbon dioxide",
      "emissions",
      "carbon footprint",
      "paris agreement",
      "ipcc",
      "sea level rise",
      "polar ice"
    ],
    related_tokens: [
      "ScientificFactTT",
      "EnvironmentalTT",
      "PolicyTT"
    ],
    verification_priority: 0.95,
    description: "Climate change and global warming"
  },
  {
    id: "environment_pollution",
    name: "Pollution",
    domain: Domain.GEOGRAPHY,
    keywords: [
      "pollution",
      "air pollution",
      "water pollution",
      "soil contamination",
      "toxic",
      "pollutant",
      "smog",
      "acid rain",
      "plastic waste",
      "oil spill"
    ],
    related_tokens: [
      "EnvironmentalTT",
      "HealthTT",
      "PolicyTT"
    ],
    verification_priority: 0.90,
    description: "Environmental pollution and contamination"
  },
  {
    id: "environment_conservation",
    name: "Conservation",
    domain: Domain.GEOGRAPHY,
    keywords: [
      "conservation",
      "endangered species",
      "extinction",
      "wildlife",
      "protected area",
      "national park",
      "sustainability",
      "renewable energy",
      "reforestation"
    ],
    related_tokens: [
      "EnvironmentalTT",
      "PolicyTT",
      "EthicalTT"
    ],
    verification_priority: 0.85,
    description: "Environmental conservation and protection"
  },
  {
    id: "environment_renewable",
    name: "Renewable Energy",
    domain: Domain.TECHNOLOGY,
    keywords: [
      "renewable",
      "solar power",
      "wind energy",
      "hydroelectric",
      "geothermal",
      "biomass",
      "clean energy",
      "sustainable",
      "solar panel",
      "wind turbine"
    ],
    related_tokens: [
      "EnvironmentalTT",
      "TechnicalTT",
      "EnergyTT"
    ],
    verification_priority: 0.88,
    description: "Renewable energy sources and technologies"
  },

  // ============================================
  // LITERATURE & ARTS (Phase 3 Expansion)
  // ============================================
  {
    id: "literature_genres",
    name: "Literary Genres",
    domain: Domain.ART,
    keywords: [
      "literature",
      "novel",
      "poetry",
      "drama",
      "fiction",
      "non-fiction",
      "genre",
      "prose",
      "verse",
      "narrative",
      "author",
      "book"
    ],
    related_tokens: [
      "CulturalTT",
      "ArtisticTT",
      "HistoricalTT"
    ],
    verification_priority: 0.70,
    description: "Literary forms and genres"
  },
  {
    id: "art_visual",
    name: "Visual Arts",
    domain: Domain.ART,
    keywords: [
      "painting",
      "sculpture",
      "drawing",
      "photography",
      "art",
      "artist",
      "canvas",
      "museum",
      "gallery",
      "renaissance",
      "impressionism",
      "modern art"
    ],
    related_tokens: [
      "ArtisticTT",
      "CulturalTT",
      "HistoricalTT"
    ],
    verification_priority: 0.70,
    description: "Visual arts and artistic movements"
  },
  {
    id: "art_music",
    name: "Music",
    domain: Domain.ART,
    keywords: [
      "music",
      "musical",
      "instrument",
      "melody",
      "harmony",
      "rhythm",
      "composer",
      "symphony",
      "opera",
      "jazz",
      "classical",
      "song"
    ],
    related_tokens: [
      "ArtisticTT",
      "CulturalTT",
      "AcousticTT"
    ],
    verification_priority: 0.68,
    description: "Music theory and musical arts"
  },
  {
    id: "art_performing",
    name: "Performing Arts",
    domain: Domain.ART,
    keywords: [
      "theater",
      "theatre",
      "dance",
      "performance",
      "actor",
      "stage",
      "ballet",
      "choreography",
      "drama",
      "play"
    ],
    related_tokens: [
      "ArtisticTT",
      "CulturalTT",
      "PerformanceTT"
    ],
    verification_priority: 0.65,
    description: "Theater, dance, and performing arts"
  },

  // ============================================
  // SOCIAL SCIENCES (Phase 3 Expansion)
  // ============================================
  {
    id: "sociology_society",
    name: "Sociology",
    domain: Domain.PSYCHOLOGY,
    keywords: [
      "sociology",
      "society",
      "social structure",
      "community",
      "culture",
      "norms",
      "values",
      "socialization",
      "institution",
      "social change"
    ],
    related_tokens: [
      "SocialTT",
      "CulturalTT",
      "ContextualTT"
    ],
    verification_priority: 0.75,
    description: "Study of human society and social behavior"
  },
  {
    id: "anthropology_culture",
    name: "Anthropology",
    domain: Domain.CULTURE,
    keywords: [
      "anthropology",
      "culture",
      "ethnography",
      "archaeology",
      "human evolution",
      "tribe",
      "kinship",
      "ritual",
      "artifact",
      "civilization"
    ],
    related_tokens: [
      "CulturalTT",
      "HistoricalTT",
      "SocialTT"
    ],
    verification_priority: 0.78,
    description: "Study of humans and human societies"
  },
  {
    id: "political_science",
    name: "Political Science",
    domain: Domain.POLITICS,
    keywords: [
      "political science",
      "government",
      "democracy",
      "republic",
      "monarchy",
      "dictatorship",
      "election",
      "vote",
      "legislation",
      "policy",
      "governance"
    ],
    related_tokens: [
      "PoliticalTT",
      "GovernmentTT",
      "PolicyTT"
    ],
    verification_priority: 0.80,
    description: "Study of political systems and governance"
  },
  {
    id: "education_pedagogy",
    name: "Education",
    domain: Domain.PSYCHOLOGY,
    keywords: [
      "education",
      "teaching",
      "learning",
      "pedagogy",
      "curriculum",
      "instruction",
      "school",
      "university",
      "student",
      "teacher",
      "literacy"
    ],
    related_tokens: [
      "EducationalTT",
      "PedagogicalTT",
      "CognitiveTT"
    ],
    verification_priority: 0.75,
    description: "Educational theory and practice"
  },

  // ============================================
  // BUSINESS & MANAGEMENT (Phase 3 Expansion)
  // ============================================
  {
    id: "business_management",
    name: "Business Management",
    domain: Domain.ECONOMICS,
    keywords: [
      "management",
      "business",
      "leadership",
      "strategy",
      "planning",
      "organization",
      "decision making",
      "operations",
      "efficiency",
      "productivity"
    ],
    related_tokens: [
      "BusinessTT",
      "StrategicTT",
      "OrganizationalTT"
    ],
    verification_priority: 0.70,
    description: "Business management and organizational leadership"
  },
  {
    id: "business_marketing",
    name: "Marketing",
    domain: Domain.ECONOMICS,
    keywords: [
      "marketing",
      "advertising",
      "brand",
      "promotion",
      "consumer",
      "market research",
      "target audience",
      "campaign",
      "digital marketing",
      "social media marketing"
    ],
    related_tokens: [
      "BusinessTT",
      "CommunicationTT",
      "StrategicTT"
    ],
    verification_priority: 0.68,
    description: "Marketing strategies and consumer behavior"
  },
  {
    id: "business_entrepreneurship",
    name: "Entrepreneurship",
    domain: Domain.ECONOMICS,
    keywords: [
      "entrepreneurship",
      "startup",
      "entrepreneur",
      "venture capital",
      "innovation",
      "business plan",
      "funding",
      "investor",
      "pitch",
      "scale"
    ],
    related_tokens: [
      "BusinessTT",
      "InnovationTT",
      "RiskTT"
    ],
    verification_priority: 0.72,
    description: "Entrepreneurship and startup ventures"
  },

  // ============================================
  // ENGINEERING (Phase 3 Expansion)
  // ============================================
  {
    id: "engineering_civil",
    name: "Civil Engineering",
    domain: Domain.TECHNOLOGY,
    keywords: [
      "civil engineering",
      "construction",
      "bridge",
      "building",
      "infrastructure",
      "structural",
      "concrete",
      "steel",
      "foundation",
      "beam",
      "load bearing"
    ],
    related_tokens: [
      "EngineeringTT",
      "StructuralTT",
      "TechnicalTT"
    ],
    verification_priority: 0.85,
    description: "Civil engineering and infrastructure design"
  },
  {
    id: "engineering_mechanical",
    name: "Mechanical Engineering",
    domain: Domain.TECHNOLOGY,
    keywords: [
      "mechanical engineering",
      "machine",
      "engine",
      "motor",
      "gear",
      "thermodynamics",
      "fluid mechanics",
      "manufacturing",
      "robotics",
      "automation"
    ],
    related_tokens: [
      "EngineeringTT",
      "MechanicalTT",
      "TechnicalTT"
    ],
    verification_priority: 0.83,
    description: "Mechanical systems and machinery"
  },
  {
    id: "engineering_electrical",
    name: "Electrical Engineering",
    domain: Domain.TECHNOLOGY,
    keywords: [
      "electrical engineering",
      "circuit",
      "electronics",
      "semiconductor",
      "transistor",
      "integrated circuit",
      "microprocessor",
      "power system",
      "signal processing"
    ],
    related_tokens: [
      "EngineeringTT",
      "ElectricalTT",
      "TechnicalTT"
    ],
    verification_priority: 0.84,
    description: "Electrical systems and electronic devices"
  },
  {
    id: "engineering_software",
    name: "Software Engineering",
    domain: Domain.TECHNOLOGY,
    keywords: [
      "software engineering",
      "software development",
      "sdlc",
      "agile",
      "scrum",
      "testing",
      "debugging",
      "version control",
      "git",
      "requirements",
      "design patterns"
    ],
    related_tokens: [
      "TechnicalTT",
      "EngineeringTT",
      "MethodologyTT"
    ],
    verification_priority: 0.80,
    description: "Software development and engineering practices"
  },

  // ============================================
  // ASTRONOMY & SPACE (Phase 3 Expansion)
  // ============================================
  {
    id: "astronomy_solar_system",
    name: "Solar System",
    domain: Domain.PHYSICS,
    keywords: [
      "solar system",
      "sun",
      "planet",
      "earth",
      "mars",
      "jupiter",
      "saturn",
      "mercury",
      "venus",
      "uranus",
      "neptune",
      "moon",
      "asteroid",
      "comet"
    ],
    related_tokens: [
      "AstronomicalTT",
      "ScientificFactTT",
      "PhysicalConstantTT"
    ],
    verification_priority: 0.92,
    description: "Solar system and planetary science"
  },
  {
    id: "astronomy_stars",
    name: "Stars & Galaxies",
    domain: Domain.PHYSICS,
    keywords: [
      "star",
      "galaxy",
      "milky way",
      "constellation",
      "nebula",
      "supernova",
      "black hole",
      "quasar",
      "pulsar",
      "stellar evolution"
    ],
    related_tokens: [
      "AstronomicalTT",
      "ScientificFactTT",
      "CosmologicalTT"
    ],
    verification_priority: 0.90,
    description: "Stars, galaxies, and deep space objects"
  },
  {
    id: "astronomy_cosmology",
    name: "Cosmology",
    domain: Domain.PHYSICS,
    keywords: [
      "cosmology",
      "universe",
      "big bang",
      "cosmic",
      "dark matter",
      "dark energy",
      "expansion",
      "hubble",
      "redshift",
      "cosmic microwave background"
    ],
    related_tokens: [
      "CosmologicalTT",
      "ScientificFactTT",
      "TheoryTT"
    ],
    verification_priority: 0.92,
    description: "Origin and evolution of the universe"
  },
  {
    id: "astronomy_space_exploration",
    name: "Space Exploration",
    domain: Domain.TECHNOLOGY,
    keywords: [
      "space exploration",
      "nasa",
      "spacecraft",
      "satellite",
      "rocket",
      "apollo",
      "iss",
      "space station",
      "astronaut",
      "mars rover",
      "space shuttle"
    ],
    related_tokens: [
      "TechnicalTT",
      "HistoricalTT",
      "AstronomicalTT"
    ],
    verification_priority: 0.85,
    description: "Space missions and exploration technology"
  },

  // ============================================
  // AGRICULTURE (Phase 3 Expansion)
  // ============================================
  {
    id: "agriculture_farming",
    name: "Agriculture & Farming",
    domain: Domain.BIOLOGY,
    keywords: [
      "agriculture",
      "farming",
      "crop",
      "harvest",
      "irrigation",
      "fertilizer",
      "pesticide",
      "soil",
      "cultivation",
      "farm",
      "agricultural"
    ],
    related_tokens: [
      "AgricultureTT",
      "BiologicalTT",
      "EconomicTT"
    ],
    verification_priority: 0.80,
    description: "Agricultural practices and crop production"
  },
  {
    id: "agriculture_livestock",
    name: "Livestock & Animal Husbandry",
    domain: Domain.BIOLOGY,
    keywords: [
      "livestock",
      "animal husbandry",
      "cattle",
      "dairy",
      "poultry",
      "sheep",
      "pig",
      "breeding",
      "veterinary",
      "ranch"
    ],
    related_tokens: [
      "AgricultureTT",
      "BiologicalTT",
      "VeterinaryTT"
    ],
    verification_priority: 0.78,
    description: "Livestock management and animal agriculture"
  },

  // ============================================
  // MEDIA & COMMUNICATIONS (Phase 3 Expansion)
  // ============================================
  {
    id: "media_journalism",
    name: "Journalism & News",
    domain: Domain.CULTURE,
    keywords: [
      "journalism",
      "news",
      "media",
      "reporter",
      "journalist",
      "press",
      "newspaper",
      "broadcast",
      "editorial",
      "investigation",
      "source"
    ],
    related_tokens: [
      "MediaTT",
      "CommunicationTT",
      "InformationalTT"
    ],
    verification_priority: 0.75,
    description: "Journalism, news media, and reporting"
  },
  {
    id: "media_communications",
    name: "Communications Theory",
    domain: Domain.CULTURE,
    keywords: [
      "communication",
      "message",
      "sender",
      "receiver",
      "medium",
      "channel",
      "feedback",
      "mass communication",
      "interpersonal",
      "rhetoric"
    ],
    related_tokens: [
      "CommunicationTT",
      "TheoryTT",
      "SocialTT"
    ],
    verification_priority: 0.70,
    description: "Communication theory and information transmission"
  },
  {
    id: "media_digital",
    name: "Digital Media",
    domain: Domain.TECHNOLOGY,
    keywords: [
      "digital media",
      "social media",
      "online",
      "internet",
      "blog",
      "podcast",
      "streaming",
      "content creation",
      "influencer",
      "viral"
    ],
    related_tokens: [
      "MediaTT",
      "TechnicalTT",
      "CulturalTT"
    ],
    verification_priority: 0.72,
    description: "Digital and social media platforms"
  }
];

/**
 * Topic Detection Service
 */
export class TopicDetector {
  private topics: Map<string, Topic>;

  constructor() {
    this.topics = new Map();
    // Load all topics into map
    TOPIC_DATABASE.forEach(topic => {
      this.topics.set(topic.id, topic);
    });
  }

  /**
   * Detect topics in text
   * Returns all matching topics sorted by confidence
   */
  detectTopics(text: string): TopicMatch[] {
    const normalized = text.toLowerCase();
    const matches: TopicMatch[] = [];

    for (const topic of this.topics.values()) {
      const matched_keywords: string[] = [];

      // Check each keyword
      for (const keyword of topic.keywords) {
        if (normalized.includes(keyword.toLowerCase())) {
          matched_keywords.push(keyword);
        }
      }

      // If we found matches, calculate confidence
      if (matched_keywords.length > 0) {
        const confidence = matched_keywords.length / topic.keywords.length;
        matches.push({
          topic,
          matched_keywords,
          confidence
        });
      }
    }

    // Sort by confidence (highest first)
    return matches.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Get highest priority topic from matches
   * Returns the full TopicMatch (not just Topic) for use in ChemistryResult
   */
  getHighestPriorityTopic(matches: TopicMatch[]): TopicMatch | null {
    if (matches.length === 0) return null;

    // Sort by verification_priority
    const sorted = [...matches].sort((a, b) =>
      b.topic.verification_priority - a.topic.verification_priority
    );

    return sorted[0];  // Return full TopicMatch, not just topic
  }

  /**
   * Get all topics by domain
   */
  getTopicsByDomain(domain: Domain): Topic[] {
    return Array.from(this.topics.values())
      .filter(topic => topic.domain === domain);
  }

  /**
   * Get topic by ID
   */
  getTopic(id: string): Topic | undefined {
    return this.topics.get(id);
  }

  /**
   * Get all topics
   */
  getAllTopics(): Topic[] {
    return Array.from(this.topics.values());
  }

  /**
   * Get statistics about topic database
   */
  stats(): {
    total_topics: number;
    by_domain: Record<string, number>;
    high_priority_topics: number;
  } {
    const by_domain: Record<string, number> = {};
    let high_priority_topics = 0;

    for (const topic of this.topics.values()) {
      // Count by domain
      by_domain[topic.domain] = (by_domain[topic.domain] || 0) + 1;

      // Count high priority (>= 0.9)
      if (topic.verification_priority >= 0.9) {
        high_priority_topics++;
      }
    }

    return {
      total_topics: this.topics.size,
      by_domain,
      high_priority_topics
    };
  }
}

// Export singleton instance
export const topicDetector = new TopicDetector();
