# Context AI Testing Prompts

This file contains comprehensive testing prompts for the Context AI platform. The prompts are organized by complexity and use case, covering various scenarios to test the system's context retrieval, reasoning capabilities, and response quality.

## Setup Instructions

1. Ensure the application is running with seeded developer data (`seed-developer.json`)
2. Use the chat interface to test these prompts
3. Toggle the context panel to verify graph retrieval
4. Test both with and without context visualization enabled

---

## 1. Simple Factual Queries

### Basic Information Retrieval
- "What are microservices?"
- "Explain container orchestration"
- "What is Kubernetes?"
- "Tell me about database sharding"

### Direct Topic Queries
- "What do you know about system design?"
- "Tell me about my Kubernetes notes"
- "What are my database research topics?"

---

## 2. Context-Aware Queries

### Personal Knowledge Base
- "Based on my notes, what are the key principles of microservices?"
- "From my system design knowledge, explain service mesh"
- "What do I know about Kubernetes resource management?"
- "According to my research, what are the challenges with database scaling?"

### Knowledge Synthesis
- "How do my microservices notes relate to container orchestration?"
- "Connect my Kubernetes knowledge with system design principles"
- "How does my database sharding research apply to distributed systems?"

---

## 3. Multi-Step Reasoning

### Problem Solving
- "I'm designing a payment system. What architecture should I use based on my notes?"
- "I need to containerize a legacy application. What should I consider from my Kubernetes knowledge?"
- "Planning database migration to microservices. What challenges should I anticipate?"

### Decision Making
- "Between horizontal and vertical scaling, which should I choose for my payment service?"
- "Should I use Kubernetes or traditional VMs for my new project?"
- "How would you recommend implementing authentication in my microservices architecture?"

---

## 4. Complex Analysis

### Comparative Analysis
- "Compare event sourcing and traditional CRUD operations for payment systems"
- "Analyze the trade-offs between monolithic and microservice architectures"
- "Compare different container orchestration platforms I've studied"

### Architectural Design
- "Design a fault-tolerant payment processing system using my knowledge"
- "Create a deployment strategy for my containerized applications"
- "Design a scalable database architecture for a high-traffic application"

---

## 5. Project-Specific Queries

### Payment Service Design
- "Review my payment service redesign project"
- "What are the key components I need for the payment microservices?"
- "How should I handle distributed transactions in my payment system?"

### Infrastructure Migration
- "What are the steps for my Kubernetes migration project?"
- "What zero-downtime deployment strategies should I use?"
- "How do I handle service discovery in my new architecture?"

---

## 6. Learning & Explanation

### Concept Deepening
- "Explain circuit breaker pattern in more detail from my notes"
- "Deep dive into the SAGA pattern for distributed transactions"
- "Help me understand horizontal pod autoscaling better"

### Practical Application
- "Show me practical examples of the concepts I've studied"
- "How would I implement rate limiting in my microservices?"
- "Give me code examples for the patterns I've learned"

---

## 7. Edge Cases & Error Handling

### Ambiguous Queries
- "What should I build?" (No context)
- "Tell me everything" (Too broad)
- "Help me with my project" (Vague)

### Out-of-Scope Queries
- "What's the weather today?"
- "How do I cook pasta?"
- "Tell me a joke"

### Contradictory Information
- "Use only information I haven't studied" (Impossible request)
- "Ignore my system design notes when answering" (Conflicting instruction)

---

## 8. Domain-Specific Testing

### Technical Deep Dives
- "Explain the CAP theorem in the context of my database research"
- "How does eventual consistency affect my payment system design?"
- "Discuss the trade-offs between SQL and NoSQL for my use cases"

### Best Practices
- "What are the security considerations for my microservices?"
- "How should I implement logging and monitoring in my architecture?"
- "What are the performance optimization techniques I should know?"

---

## 9. Conversational Continuity

### Follow-up Questions
1. "What are microservices?"
2. "How do they compare to monoliths?"
3. "What are the main challenges in implementing them?"
4. "Can you give examples from my projects?"

### Context Preservation
- Start a conversation about payment systems
- Ask follow-up about specific technologies
- Reference earlier parts of the conversation
- Test if context from previous messages is maintained

---

## 10. Performance & Scalability Testing

### Large Context Queries
- "Summarize all my system design knowledge"
- "Create a comprehensive overview of my technical expertise"
- "Connect all my research topics into a cohesive framework"

### Rapid Sequential Queries
- Send multiple related questions in quick succession
- Test context panel updates
- Verify response streaming performance

---

## 11. Integration Testing

### API Functionality
- Test all CRUD operations through chat
- Verify context retrieval accuracy
- Check rate limiting behavior

### UI/UX Testing
- Test context panel toggle functionality
- Verify message streaming animations
- Check responsive design on different screen sizes

---

## 12. Error Scenarios

### Network Issues
- Test behavior during slow responses
- Verify error handling for API failures
- Check retry mechanisms

### Invalid Requests
- Test with malformed input
- Verify validation error handling
- Check authentication failure scenarios

---

## 13. Advanced Use Cases

### Code Generation
- "Generate a Dockerfile for my payment service"
- "Create Kubernetes manifests for my microservices"
- "Write a database migration script"

### Documentation
- "Create API documentation for my payment service"
- "Write deployment guides based on my notes"
- "Generate troubleshooting guides"

---

## 14. User Experience Testing

### Onboarding Experience
- First-time user interactions
- Context panel discovery
- Understanding response quality

### Power User Features
- Advanced query techniques
- Context manipulation
- Multi-step problem solving

---

## Testing Checklist

- [ ] Simple queries return accurate information
- [ ] Context panel shows relevant nodes
- [ ] Complex queries demonstrate reasoning
- [ ] Streaming responses work smoothly
- [ ] Authentication is required for personalized responses
- [ ] Error states are handled gracefully
- [ ] UI is responsive and accessible
- [ ] Performance is acceptable for complex queries
- [ ] Context is preserved across conversation
- [ ] Rate limiting works appropriately

## Expected Behaviors

1. **Context Relevance**: Responses should incorporate user's specific knowledge
2. **Accuracy**: Information should be correct and well-explained
3. **Helpfulness**: Responses should be actionable and practical
4. **Transparency**: Context usage should be visible when panel is enabled
5. **Safety**: Appropriate boundaries for out-of-scope questions
6. **Performance**: Fast response times even for complex queries

## Metrics to Track

- Response accuracy
- Context retrieval relevance
- Response time
- User satisfaction
- Error rate
- Feature usage (context panel, etc.)
