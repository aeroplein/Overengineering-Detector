ALTER TABLE users
ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'user';

ALTER TABLE users
DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE users
ADD CONSTRAINT users_role_check CHECK (role IN ('user', 'admin'));

ALTER TABLE technologies
ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS best_for TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS risk_notes TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS alternatives TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS docs_url TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

UPDATE technologies AS t
SET description = CASE WHEN COALESCE(t.description, '') = '' THEN seed.description ELSE t.description END,
    best_for = CASE WHEN COALESCE(t.best_for, '') = '' THEN seed.best_for ELSE t.best_for END,
    risk_notes = CASE WHEN COALESCE(t.risk_notes, '') = '' THEN seed.risk_notes ELSE t.risk_notes END,
    alternatives = CASE WHEN COALESCE(t.alternatives, '') = '' THEN seed.alternatives ELSE t.alternatives END,
    docs_url = CASE WHEN COALESCE(t.docs_url, '') = '' THEN seed.docs_url ELSE t.docs_url END
FROM (
    VALUES
    ('React', 'Frontend', 'Component-based UI library for interactive web interfaces.', 'Dashboards, SaaS apps, and teams that need a large ecosystem.', 'Can be too much for tiny static pages and often needs routing/build choices.', 'Vue, Svelte, plain JavaScript', 'https://react.dev/'),
    ('Vue', 'Frontend', 'Progressive frontend framework with approachable templates and reactivity.', 'Small to mid-size apps where fast developer onboarding matters.', 'The ecosystem is smaller than React for some enterprise patterns.', 'React, Svelte', 'https://vuejs.org/'),
    ('Angular', 'Frontend', 'Full frontend framework with routing, forms, dependency injection, and TypeScript defaults.', 'Large enterprise apps that need strong conventions.', 'Heavy for small projects and slower to learn.', 'React, Vue', 'https://angular.dev/'),
    ('Svelte', 'Frontend', 'Compiler-based UI framework that ships small runtime output.', 'Lean interfaces and prototypes where bundle size matters.', 'Fewer enterprise libraries and hiring signals than React or Angular.', 'React, Vue', 'https://svelte.dev/'),
    ('Next.js', 'Frontend', 'React framework for routing, server rendering, and full-stack web apps.', 'SEO-heavy React apps, product sites, and apps needing server rendering.', 'Adds deployment and caching concepts that simple SPAs may not need.', 'React SPA, Remix', 'https://nextjs.org/docs'),
    ('TypeScript', 'Frontend', 'Typed JavaScript for safer frontend code and clearer contracts.', 'Growing codebases, shared models, and team projects.', 'Small scripts may not justify the build setup.', 'JavaScript', 'https://www.typescriptlang.org/docs/'),
    ('JavaScript', 'Frontend', 'Browser-native scripting language for frontend behavior.', 'Simple pages, prototypes, and lightweight interactivity.', 'Large apps can become fragile without types or structure.', 'TypeScript', 'https://developer.mozilla.org/en-US/docs/Web/JavaScript'),
    ('Node.js', 'Backend', 'JavaScript runtime commonly used for APIs and server tooling.', 'I/O-heavy APIs and teams sharing JavaScript across stack layers.', 'CPU-heavy workloads and deeply typed domains may need extra care.', 'Go, Java, Python', 'https://nodejs.org/en/learn'),
    ('Express', 'Backend', 'Minimal Node.js web framework for HTTP APIs.', 'Small APIs, course demos, and projects needing low ceremony.', 'Larger systems need added structure for validation, auth, and errors.', 'NestJS, Fastify', 'https://expressjs.com/'),
    ('NestJS', 'Backend', 'Opinionated Node.js framework with modules, DI, and TypeScript patterns.', 'Larger backend teams that want structure around services and controllers.', 'Can feel heavy for simple CRUD APIs.', 'Express, Fastify', 'https://docs.nestjs.com/'),
    ('Spring Boot', 'Backend', 'Java framework for production-grade backend services.', 'Enterprise APIs, mature integrations, and long-lived systems.', 'Startup time and configuration may be excessive for tiny apps.', 'Express, Django, Go', 'https://spring.io/projects/spring-boot'),
    ('Django', 'Backend', 'Python web framework with ORM, admin, auth, and batteries included.', 'CRUD-heavy apps and admin-backed products.', 'Less flexible for very custom async service designs.', 'Flask, FastAPI', 'https://docs.djangoproject.com/'),
    ('Flask', 'Backend', 'Small Python web framework for simple APIs and web apps.', 'Lightweight services, prototypes, and educational projects.', 'Large projects need explicit structure and extension choices.', 'Django, FastAPI', 'https://flask.palletsprojects.com/'),
    ('Laravel', 'Backend', 'PHP framework with strong conventions for web apps and APIs.', 'CRUD apps, admin panels, and teams comfortable with PHP.', 'May not fit teams avoiding PHP or needing minimal runtime layers.', 'Django, Express', 'https://laravel.com/docs'),
    ('Python', 'Language', 'Readable general-purpose language with strong data and web ecosystems.', 'Automation, ML-adjacent features, and quick backend prototypes.', 'Runtime performance may be limiting for low-latency services.', 'Go, Java', 'https://docs.python.org/3/'),
    ('Java', 'Language', 'Mature typed language for backend and enterprise systems.', 'Large teams, strict contracts, and JVM ecosystems.', 'Verbose for quick prototypes.', 'Kotlin, Go', 'https://docs.oracle.com/en/java/'),
    ('C#', 'Language', 'Typed language commonly used with .NET for backend and desktop apps.', '.NET APIs, enterprise apps, and Microsoft ecosystems.', 'Less natural for teams outside the .NET stack.', 'Java, TypeScript', 'https://learn.microsoft.com/en-us/dotnet/csharp/'),
    ('Go', 'Language', 'Compiled language focused on simple concurrency and service performance.', 'Network services, CLIs, and infrastructure tools.', 'Less expressive for highly abstract domain models.', 'Node.js, Java', 'https://go.dev/doc/'),
    ('Rust', 'Language', 'Systems language focused on memory safety and performance.', 'Performance-critical services and systems programming.', 'Steep learning curve and slower feature delivery for simple apps.', 'Go, Java', 'https://doc.rust-lang.org/book/'),
    ('PostgreSQL', 'Database', 'Relational database with strong SQL, indexing, and JSON support.', 'Transactional apps, reporting, and reliable persistent data.', 'Requires schema design and operations knowledge.', 'SQLite, MySQL', 'https://www.postgresql.org/docs/'),
    ('MySQL', 'Database', 'Popular relational database for web applications.', 'Standard CRUD apps and hosting environments with MySQL support.', 'Advanced analytics and JSON use cases may favor PostgreSQL.', 'PostgreSQL, SQLite', 'https://dev.mysql.com/doc/'),
    ('MongoDB', 'Database', 'Document database storing flexible JSON-like documents.', 'Rapidly changing document shapes and content-heavy data.', 'Can be a poor fit for relational data and strict transactions.', 'PostgreSQL, MySQL', 'https://www.mongodb.com/docs/'),
    ('Redis', 'Cache', 'In-memory data store used for caching, queues, and ephemeral state.', 'Caching hot reads, rate limits, sessions, and fast counters.', 'Adds infrastructure and data consistency concerns.', 'Database indexes, in-process cache', 'https://redis.io/docs/latest/'),
    ('SQLite', 'Database', 'Embedded relational database stored in a local file.', 'Local apps, prototypes, tests, and small single-user deployments.', 'Not ideal for multi-server or heavy concurrent writes.', 'PostgreSQL, MySQL', 'https://www.sqlite.org/docs.html'),
    ('Docker', 'DevOps', 'Container tooling for packaging apps and dependencies.', 'Consistent development environments and deployable services.', 'Can add setup overhead for very small local-only projects.', 'Native runtime setup', 'https://docs.docker.com/'),
    ('Kubernetes', 'DevOps', 'Container orchestration platform for scheduling and operating services.', 'Large distributed systems with scaling and operations teams.', 'Usually overkill for small apps and course demos.', 'Docker Compose, managed app platforms', 'https://kubernetes.io/docs/'),
    ('AWS', 'Cloud', 'Large cloud platform with compute, storage, networking, and managed services.', 'Production systems needing managed infrastructure options.', 'Easy to overbuild and create cost/ops complexity.', 'Render, Railway, Heroku-style platforms', 'https://docs.aws.amazon.com/'),
    ('GCP', 'Cloud', 'Google cloud platform with compute, data, and managed services.', 'Data-heavy products and teams using Google cloud services.', 'Can add IAM, billing, and deployment complexity too early.', 'Firebase, managed app platforms', 'https://cloud.google.com/docs'),
    ('Azure', 'Cloud', 'Microsoft cloud platform with compute, data, and enterprise integrations.', 'Microsoft-centered organizations and .NET-heavy stacks.', 'Cloud setup can be excessive for prototypes.', 'Render, Railway, AWS', 'https://learn.microsoft.com/en-us/azure/'),
    ('React Native', 'Mobile', 'React-based framework for building cross-platform mobile apps.', 'Teams wanting one JavaScript/TypeScript mobile codebase.', 'Native edge cases can require platform-specific work.', 'Flutter, native Swift/Kotlin', 'https://reactnative.dev/docs/getting-started'),
    ('Flutter', 'Mobile', 'Dart UI toolkit for cross-platform mobile apps.', 'Highly custom mobile UIs across iOS and Android.', 'Requires Dart knowledge and may not match native platform feel by default.', 'React Native, native Swift/Kotlin', 'https://docs.flutter.dev/'),
    ('Swift', 'Mobile', 'Apple language for native iOS and macOS apps.', 'High-quality Apple-platform apps.', 'Only covers Apple platforms without separate Android work.', 'Flutter, React Native', 'https://www.swift.org/documentation/'),
    ('Kotlin', 'Mobile', 'Modern language commonly used for native Android apps.', 'Native Android apps and JVM-backed codebases.', 'Android-only unless paired with multiplatform setup.', 'Flutter, React Native', 'https://kotlinlang.org/docs/home.html')
) AS seed(name, category, description, best_for, risk_notes, alternatives, docs_url)
WHERE t.name = seed.name
  AND t.category = seed.category;
