<a id="readme-top"></a>

![GitHub Repo stars](https://img.shields.io/github/stars/deskree-inc/blok)
![GitHub forks](https://img.shields.io/github/forks/deskree-inc/blok)
![GitHub Issues or Pull Requests](https://img.shields.io/github/issues/deskree-inc/blok)
![GitHub License](https://img.shields.io/github/license/deskree-inc/blok)
![GitHub contributors](https://img.shields.io/github/contributors/deskree-inc/blok)
![Discord](https://img.shields.io/discord/1317176082268426240)


<!-- PROJECT LOGO -->
<br />
<div align="center">
  <a href="https://github.com/deskree-inc/blok">
    <img src="docs/assets/logo/dark.svg" alt="Logo" height="80">
  </a>

  <h3 align="center">Blok</h3>

  <p align="center">
    Blok  is an open-source framework that enables developers to build lightweight, modular, and scalable backend applications using Blok.
    <br />
    <a href="https://blok.build/"><strong>Explore the docs »</strong></a>
    <br />
    <br />
    <a href="https://github.com/deskree-inc/blok/issues/new?assignees=&labels=&projects=&template=bug_report.md&title=">Report Bug</a>
    ·
    <a href="https://github.com/deskree-inc/blok/issues/new?assignees=&labels=&projects=&template=feature_request.md&title=">Request Feature</a>
  </p>
</div>

---

<!-- TABLE OF CONTENTS -->
<details>
  <summary>📋 Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
      <li><a href="#key-highlights">Key Highlights</a>
      <li><a href="#why-blok">Why Blok?</a>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
    </li>
    <li><a href="#creating-nodes--workflows">Creating Nodes & Workflows</a></li>
    <li><a href="#running-workflows">Running Workflows</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#contributing-to-the-blok-documentation">Contributing to the Blok Documentation</a></li>
    <ul>
    <li><a href="#prerequisites">Prerequisites</a></li>
    </ul>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
    <li><a href="#acknowledgments">Acknowledgments</a></li>
  </ol>
</details>

---


## About The Project  

**Blok** is an open-source framework designed to simplify backend development by enabling developers to implement the **modular architecture** effortlessly. Built with **TypeScript**, this framework helps you create lightweight, modular, and scalable backend systems that adhere to the **Single Responsibility Principle (SRP)**.  

By combining an intuitive API, programmatic workflow orchestration, and powerful tooling, blok allows you to focus on writing business logic while abstracting the complexities of infrastructure, scaling, and resource management.  

### Key Highlights  

- **Modular Architecture**: Divide backend logic into reusable, single-responsibility units that are easy to manage, scale, and debug.  
- **Developer-Friendly Tools**: Use TypeScript-powered APIs, templates, and a CLI for quick project setup and workflow creation.  
- **Efficient and Scalable**: Built to support dynamic workflows with containerized execution and independent scalability for each blok.  
- **Community-Driven**: Collaborate, share, and benefit from a growing library of community-created nodes and workflows.  

### Why Blok?  

Modern backend development often suffers from over-engineered solutions, resource inefficiencies, and complex architectures. **Blok** addresses these pain points by offering:  

- **Modular Design**: Reuse components across projects, reducing redundancy and improving productivity.  
- **Simplified Scaling**: Focus on scaling individual bloks based on real-time demands, optimizing resource usage.  
- **Flexibility**: Build workflows programmatically or using pre-built templates for common tasks like HTTP APIs, event processing, and scheduled jobs.  

With **Blok**, backend development becomes modular, predictable, and future-proof, making it ideal for both small projects and large-scale systems.  


<p align="right">(<a href="#readme-top">back to top</a>)</p>

---


<!-- GETTING STARTED -->
## Getting Started

To start developing your project, simply run:

```bash
  npx nanoctl@latest create project
```

And follow the instructions of the CLI

_For more information and examples, visit [Getting Started](https://blok.build/docs/d/getting-started/nanoctl)_

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

## Creating Nodes & Workflows

* **Node** is a small functioning unit designed to perform a specific task within a workflow
* **Workflow** is a collection of nodes group together in a certain sequence to create a piece of business logic that starts with a trigger
* **Trigger** is an event or condition that starts the execution of a workflow

_For a step-by-step example of how to use nodes, workflows, and triggers, visit [Quickstart](http://localhost:4000/docs/d/quickstart)_

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

## Running Workflows

To run the created workflow locally:

1. Start the runner via `npm run dev`
2. Use tools like POSTMAN, curl, or any HTTP client to test workflows at `http://localhost:4000/{workflow-name}`

_For more examples, please refer to the [Executing Workflows](https://blok.build/docs/d/core-concepts/executing-workflows)_

<p align="right">(<a href="#readme-top">back to top</a>)</p>


---


<!-- CONTRIBUTING -->
## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".
Don't forget to give the project a star! Thanks again!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

<!-- CONTRIBUTING TO THE BLOK DOCUMENTATION -->
## Contributing to the Blok Documentation

### Prerequisites
Make sure you have the following installed on your system:

- [Node.js](https://nodejs.org/)

To contribute to the Blok documentation, follow these steps:

1. Fork the project

     - Go to the [Blok repository](https://github.com/deskree-inc/blok) and fork it to your GitHub account.

2. Clone the project to your local machine

```
   git clone https://github.com/deskree-inc/blok.git
```
3. Navigate to the project directory
```
cd Blok
```
4. Add the upstream remote
```
git remote add upstream https://github.com/deskree-inc/blok.git
```
5. Run the application in development mode

```
npx mintlify dev
```
6. Create a new branch for your changes
```bash
git checkout -b "name-of-your-branch"
```
7. Stage your changes
```
  git add .
```
8. Commit the changes
```
git commit -m "first_commit"
```
9. Push your changes
```
git push origin name-of-your-branch
```
10. Create a pull request

---

<!-- LICENSE -->
## License

Distributed under the Apache License 2.0. See `LICENSE.txt` for more information.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

<!-- CONTACT -->
## Contact

Discord: [Blok](https://discord.gg/uFs9bYwfM9)

X: [@nanoservice_ts](https://x.com/nanoservice_ts)

Reddit: [r/nanoservice](https://www.reddit.com/r/nanoservice/)

Project Link: [https://github.com/deskree-inc/blok](https://github.com/deskree-inc/blok)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

<!-- ACKNOWLEDGMENTS -->
## Acknowledgments

Some awesome tools used in the project:

* [Grafana](https://github.com/grafana/grafana)
* [Docker](https://github.com/docker)
* [Open Telemetry](https://github.com/open-telemetry)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---