// API base URL - update this when deployed
const API_BASE_URL = "http://localhost:5000/api";

// Functions for API interactions
async function refineQuery(query) {
    try {
        const response = await fetch(`${API_BASE_URL}/refine-query`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query: query }),
        });
        
        if (!response.ok) {
            throw new Error(`Error: ${response.statusText}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error("Error refining query:", error);
        return { protein_name: query, alternative_names: [], description: "Could not refine query" };
    }
}

async function getProteinInfo(proteinName) {
    try {
        const response = await fetch(`${API_BASE_URL}/protein/${proteinName}`);
        
        if (!response.ok) {
            throw new Error(`Error: ${response.statusText}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error("Error getting protein info:", error);
        return { error: error.message };
    }
}

async function getProteinStructure(proteinName) {
    try {
        const response = await fetch(`${API_BASE_URL}/protein/${proteinName}/structure`);
        
        if (!response.ok) {
            throw new Error(`Error: ${response.statusText}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error("Error getting protein structure:", error);
        return { error: error.message };
    }
}

async function getProteinAnalysis(proteinName) {
    try {
        const response = await fetch(`${API_BASE_URL}/protein/${proteinName}/analysis`);
        
        if (!response.ok) {
            throw new Error(`Error: ${response.statusText}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error("Error getting protein analysis:", error);
        return { error: error.message };
    }
}

async function getDrugAssociations(proteinName) {
    try {
        const response = await fetch(`${API_BASE_URL}/protein/${proteinName}/drugs`);
        
        if (!response.ok) {
            throw new Error(`Error: ${response.statusText}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error("Error getting drug associations:", error);
        return { error: error.message };
    }
}

async function sendChatMessage(messages) {
    try {
        const response = await fetch(`${API_BASE_URL}/conversation`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ messages: messages }),
        });
        
        if (!response.ok) {
            throw new Error(`Error: ${response.statusText}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error("Error in chat:", error);
        return { response: `Error: ${error.message}` };
    }
}

// Display protein structure using 3Dmol.js with rounded corners
function displayProteinStructure(pdbData, containerId) {
    if (!pdbData) {
        document.getElementById(containerId).innerHTML = "<p class='error'>Could not retrieve 3D structure data</p>";
        return;
    }
    
    // Ensure container is properly sized before creating viewer
    let element = document.getElementById(containerId);
    element.style.width = "100%";
    element.style.height = "400px";
    element.style.position = "relative";
    
    // Create a new viewer with explicit dimensions
    let config = { backgroundColor: 'white' };
    let viewer = $3Dmol.createViewer(element, config);
    
    // Add the model
    viewer.addModel(pdbData, "pdb");
    
    // Style and color the protein
    viewer.setStyle({}, {cartoon: {color: 'spectrum'}});
    
    // Zoom to fit the model
    viewer.zoomTo();
    
    // Start spinning the model
    viewer.spin(true);
    
    // Render the scene
    viewer.render();
}

// Format confidence level with color
function formatConfidence(confidence) {
    if (confidence > 0.9) {
        return `<span class="confidence high">🟢 High confidence (${confidence.toFixed(2)})</span>`;
    } else if (confidence > 0.7) {
        return `<span class="confidence medium">🟡 Medium confidence (${confidence.toFixed(2)})</span>`;
    } else {
        return `<span class="confidence low">🔴 Low confidence (${confidence.toFixed(2)})</span>`;
    }
}

// Create a data table from an array of objects with activity value column fix
function createDataTable(data, containerId) {
    if (!data || data.length === 0) {
        document.getElementById(containerId).innerHTML = "<p>No data available</p>";
        return;
    }
    
    const table = document.createElement('table');
    table.className = 'data-table';
    
    // Create header row with activity value column
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    
    // Get all unique keys from all objects
    const allKeys = new Set();
    data.forEach(item => {
        Object.keys(item).forEach(key => allKeys.add(key));
    });
    
    // Ensure activity_value is included and properly formatted
    const keysArray = Array.from(allKeys);
    if (!keysArray.includes('activity_value') && keysArray.includes('activity')) {
        keysArray.push('activity_value');
    }
    
    keysArray.forEach(key => {
        if (key !== 'activity' || !keysArray.includes('activity_value')) {
            const th = document.createElement('th');
            th.textContent = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            headerRow.appendChild(th);
        }
    });
    
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    // Create body rows
    const tbody = document.createElement('tbody');
    
    data.forEach(item => {
        const row = document.createElement('tr');
        
        keysArray.forEach(key => {
            // Skip activity if we have activity_value as a separate column
            if (key === 'activity' && keysArray.includes('activity_value')) return;
            
            const cell = document.createElement('td');
            
            if (key === 'activity_value' && !item.hasOwnProperty('activity_value')) {
                // Extract activity value from activity string if needed
                const activityStr = item.activity || '';
                const match = activityStr.match(/=\s*([\d.]+)/);
                cell.textContent = match ? match[1] : '';
            } else {
                cell.textContent = item[key] || '';
            }
            
            row.appendChild(cell);
        });
        
        tbody.appendChild(row);
    });
    
    table.appendChild(tbody);
    document.getElementById(containerId).innerHTML = '';
    document.getElementById(containerId).appendChild(table);
}

// Show loading indicator
function showLoading(elementId, message = "Loading...") {
    document.getElementById(elementId).innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <p>${message}</p>
        </div>
    `;
}

// Hide a section
function hideSection(sectionId) {
    document.getElementById(sectionId).style.display = 'none';
}

// Show a section
function showSection(sectionId) {
    document.getElementById(sectionId).style.display = 'block';
}

// Initialize chat
let chatMessages = [];
let currentProtein = null;

// Format analysis text for better display
function formatAnalysisText(text) {
    if (!text) return "No analysis available";
    
    // Remove any ```markdown and ``` tags that might be present
    text = text.replace(/```markdown/g, '').replace(/```/g, '');
    
    // Convert markdown headers to HTML
    let formatted = text
        .replace(/^#{1,6}\s+(.*?)$/gm, '<h4>$1</h4>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>');
    
    return `<p>${formatted}</p>`;
}

// Main search function
async function get_info() {
    let proteinQuery = document.getElementById("protein-input").value.trim();
    
    if (!proteinQuery) {
        alert("Please enter a protein name");
        return;
    }
    
    // Show results container
    showSection("results-container");
    
    // Step 1: Use backend to refine the search
    showLoading("search-results", "Refining search...");
    
    try {
        const refinedData = await refineQuery(proteinQuery);
        const refinedQuery = refinedData.protein_name || proteinQuery;
        
        // Store current protein for chat context
        currentProtein = refinedQuery;
        
        // Update chat context display if chat tab exists
        const proteinContext = document.getElementById("protein-context");
        if (proteinContext) {
            proteinContext.innerHTML = `
                <p><strong>Currently exploring:</strong> <span class="active-protein">${refinedQuery}</span>
                <button class="small-button" onclick="clearProteinContext()">Clear</button></p>
            `;
        }
        
        // Hide the search results section - we're removing it completely
        hideSection("search-results");
        
        // Step 2: Get protein info
        showLoading("protein-info", "Loading protein information...");
        const proteinInfo = await getProteinInfo(refinedQuery);
        
        if (!proteinInfo.error) {
            const functionData = proteinInfo.function || {};
            
            // Create the info-structure container
            document.getElementById("protein-info").innerHTML = `
                <div class="info-structure-container">
                    <div class="protein-details">
                        <div>
                            <p><strong>UniProt ID:</strong> ${functionData.id || "Unknown"}</p>
                            <p><strong>Protein Name:</strong> ${functionData.name || "Unknown"}</p>
                            <p><strong>Gene Names:</strong> ${(functionData.gene_names || []).join(", ")}</p>
                            <p><strong>Organism:</strong> ${functionData.organism || "Unknown"}</p>
                        </div>
                        <div class="function-description">
                            <h4>Biological Function:</h4>
                            <p>${functionData.function || "Function information not available"}</p>
                        </div>
                    </div>
                    
                    <div id="structure-container" class="structure-container">
                        <div class="structure-metadata">
                            <h4>3D Structure</h4>
                            <p>Loading protein structure...</p>
                        </div>
                        <div id="structure-viewer" class="structure-viewer-container"></div>
                    </div>
                </div>
            `;
            
            showSection("protein-info-section");
            
            // Remove variant data call
            // displayVariantData(refinedQuery);
            
            // Get and display protein structure immediately in the right panel
            const structureData = await getProteinStructure(refinedQuery);
            
            if (!structureData.error && structureData.pdb_data?.pdb_data) {
                const pdbData = structureData.pdb_data.pdb_data;
                
                document.querySelector("#structure-container .structure-metadata").innerHTML = `
                    <h4>Structure Information</h4>
                    <p><strong>UniProt ID:</strong> ${structureData.uniprot_id || "Unknown"}</p>
                    ${structureData.structure_metadata && structureData.structure_metadata[0]?.confidenceAvgDistance ?
                      `<p><strong>Model Confidence:</strong> ${formatConfidence(parseFloat(structureData.structure_metadata[0].confidenceAvgDistance))}</p>` : ''}
                `;
                
                if (typeof $3Dmol !== 'undefined') {
                    displayProteinStructure(pdbData, "structure-viewer");
                } else {
                    document.getElementById("structure-viewer").innerHTML = `
                        <div class="structure-placeholder">
                            <h4>3D Structure Available</h4>
                            <p>Please include 3Dmol.js library to view the structure</p>
                        </div>
                    `;
                }
            } else {
                document.querySelector("#structure-container .structure-metadata").innerHTML = `
                    <h4>Structure Information</h4>
                    <p class="error">Could not retrieve 3D structure data</p>
                `;
                document.getElementById("structure-viewer").innerHTML = `
                    <div class="structure-placeholder">
                        <h4>Structure Not Available</h4>
                        <p>No 3D structure data could be found for this protein</p>
                    </div>
                `;
            }
            
            // Hide the separate structure section since we've integrated it
            hideSection("structure-section");
            
            // Step 4: Get and display protein analysis
            showLoading("analysis-container", "Loading protein analysis from UniProt...");
            showSection("analysis-section");
            
            const analysisData = await getProteinAnalysis(refinedQuery);
            
            if (!analysisData.error) {
                document.getElementById("analysis-container").innerHTML = `
                    <div class="analysis-content">
                        ${formatAnalysisText(analysisData.analysis)}
                    </div>
                `;
            } else {
                document.getElementById("analysis-container").innerHTML = `
                    <p class="error">Error loading analysis: ${analysisData.error || "Unknown error"}</p>
                `;
            }
            
            // Step 5: Get and display drug associations with fixed table
            showLoading("drugs-container", "Loading drug information from ChEMBL...");
            showSection("drugs-section");
            
            const drugData = await getDrugAssociations(refinedQuery);
            
            if (!drugData.error) {
                const drugAssociations = drugData.drug_associations || {};
                
                if (drugAssociations.drugs && drugAssociations.drugs.length > 0) {
                    const drugs = drugAssociations.drugs.map(drug => {
                        // Create a copy of the drug object
                        let updatedDrug = {...drug};
                        
                        // Extract activity value if not already present
                        if (drug.activity && !drug.activity_value) {
                            const match = drug.activity.match(/=\s*([\d.]+)/);
                            if (match) {
                                updatedDrug.activity = drug.activity.replace(/=\s*[\d.]+/, '').trim();
                                updatedDrug.activity_value = match[1];
                            } else {
                                // No match found, set default value
                                updatedDrug.activity_value = "0.0";
                            }
                        } else if (!drug.activity_value) {
                            // No activity value present, set default
                            updatedDrug.activity_value = "0.0";
                        }
                        
                        return updatedDrug;
                    });
                    
                    document.getElementById("drugs-container").innerHTML = `
                        <h4>ChEMBL Target ID: ${drugAssociations.target_chembl_id || "Unknown"}</h4>
                        <h4>Target Name: ${drugAssociations.target_name || "Unknown"}</h4>
                        <div id="drugs-table"></div>
                    `;
                    
                    createDataTable(drugs, "drugs-table");
                } else {
                    document.getElementById("drugs-container").innerHTML = `
                        <p class="info">No drug associations found for this protein</p>
                    `;
                }
            } else {
                document.getElementById("drugs-container").innerHTML = `
                    <p class="error">Error loading drug information: ${drugData.error || "Unknown error"}</p>
                `;
            }
            
            // Scroll to results
            document.getElementById("results-container").scrollIntoView({ behavior: "smooth" });
            
        } else {
            // Display error message
            document.getElementById("protein-info").innerHTML = `
                <p class="error">Error: ${proteinInfo.error || "No protein information found"}</p>
            `;
            hideSection("structure-section");
            hideSection("analysis-section");
            hideSection("drugs-section");
        }
        
        // Keep the search-results section completely hidden
        hideSection("search-results");
        
    } catch (error) {
        console.error("Error processing search:", error);
        document.getElementById("search-results").innerHTML = `
            <p class="error">Error: ${error.message}</p>
        `;
        hideSection("protein-info-section");
        hideSection("structure-section");
        hideSection("analysis-section");
        hideSection("drugs-section");
    }
}

// Chat functionality with improved animations and custom responses
async function sendChat() {
    const chatInput = document.getElementById("chat-input");
    const message = chatInput.value.trim();
    
    if (!message) {
        return;
    }
    
    // Add message to chat history
    chatMessages.push(message);
    
    // Display user message with animation delay
    addChatMessage("user", message);
    
    // Clear input
    chatInput.value = "";
    
    // Show thinking indicator
    setTimeout(() => {
        addChatMessage("assistant", `<div class="typing-indicator">
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
        </div>`, "thinking");
        
        // Get response from API with slight delay for better UX
        setTimeout(async () => {
            try {
                // Include the current protein context if available
                const contextMessage = currentProtein ? 
                    `The user is currently exploring the protein: ${currentProtein}. Please provide specific information about this protein in your response.` : "";
                
                const contextualMessages = contextMessage ? 
                    [contextMessage, ...chatMessages] : chatMessages;
                
                const response = await sendChatMessage(contextualMessages);
                
                if (response.response) {
                    // Replace "thinking" message with actual response
                    document.querySelector(".chat-message.thinking").remove();
                    
                    // Add assistant response with typing effect
                    addChatMessage("assistant", response.response, "", true);
                    
                    // Add to chat history
                    chatMessages.push(response.response);
                } else {
                    // Replace "thinking" message with error
                    document.querySelector(".chat-message.thinking").remove();
                    addChatMessage("assistant", "Sorry, I couldn't process your request.");
                }
            } catch (error) {
                // Replace "thinking" message with error
                document.querySelector(".chat-message.thinking").remove();
                addChatMessage("assistant", `Error: ${error.message}`);
            }
        }, 1000);
    }, 500);
    
    // Scroll to bottom of chat container
    const chatContainer = document.getElementById("chat-messages");
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Enhanced chat message display with typing animation
function addChatMessage(role, content, className = "", useTyping = false) {
    const chatContainer = document.getElementById("chat-messages");
    
    const messageDiv = document.createElement("div");
    messageDiv.className = `chat-message ${role} ${className}`;
    
    const iconSpan = document.createElement("span");
    iconSpan.className = "chat-icon";
    iconSpan.textContent = role === "user" ? "👤" : "🤖";
    
    const contentDiv = document.createElement("div");
    contentDiv.className = "chat-content";
    
    if (useTyping && role === "assistant") {
        // Start with empty content for typing animation
        contentDiv.innerHTML = "";
        
        // Append the basic structure
        messageDiv.appendChild(iconSpan);
        messageDiv.appendChild(contentDiv);
        chatContainer.appendChild(messageDiv);
        
        // Create typing animation
        let i = 0;
        const speed = 30; // typing speed (ms)
        
        function typeWriter() {
            if (i < content.length) {
                // For HTML content, we need to build it character by character
                contentDiv.innerHTML += content.charAt(i);
                i++;
                setTimeout(typeWriter, speed);
            }
        }
        
        // Start typing animation
        setTimeout(typeWriter, 200);
    } else {
        // Regular message without typing effect
        contentDiv.innerHTML = content;
        messageDiv.appendChild(iconSpan);
        messageDiv.appendChild(contentDiv);
        chatContainer.appendChild(messageDiv);
    }
    
    // Scroll to the latest message
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Add function to clear protein context
function clearProteinContext() {
    currentProtein = null;
    document.getElementById("protein-context").innerHTML = `
        <p>Start chatting about proteins or search for a specific protein in the Explorer tab.</p>
    `;
}

// Add a function to render variant data
async function displayVariantData(proteinName) {
    const variantContainer = document.getElementById("variant-data");
    
    if (!variantContainer) return;
    
    try {
        variantContainer.innerHTML = `<div class="loading"><div class="spinner"></div><p>Loading variant data...</p></div>`;
        
        const variantData = await getProteinVariants(proteinName);
        
        if (variantData.error || !variantData.variants || variantData.variants.length === 0) {
            variantContainer.innerHTML = `<p>No variant information available for this protein.</p>`;
            return;
        }
        
        let variantHTML = '';
        variantData.variants.slice(0, 5).forEach(variant => {
            variantHTML += `
                <div class="variant-card">
                    <p><strong>Variant ID:</strong> ${variant.id || 'Unknown'}</p>
                    <p><strong>Type:</strong> ${variant.type || 'Unknown'}</p>
                    ${variant.consequence ? `<p><strong>Consequence:</strong> ${variant.consequence}</p>` : ''}
                    ${variant.clinical_significance ? `<p><strong>Clinical Significance:</strong> ${variant.clinical_significance}</p>` : ''}
                </div>
            `;
        });
        
        if (variantData.variants.length > 5) {
            variantHTML += `<p><em>Showing 5 of ${variantData.variants.length} variants</em></p>`;
        }
        
        variantContainer.innerHTML = variantHTML;
    } catch (error) {
        console.error("Error displaying variant data:", error);
        variantContainer.innerHTML = `<p class="error">Error loading variant information: ${error.message}</p>`;
    }
}

// Event listeners
document.addEventListener("DOMContentLoaded", function() {
    // Enter key for search
    document.getElementById("protein-input").addEventListener("keypress", function(event) {
        if (event.key === "Enter") {
            event.preventDefault();
            get_info();
        }
    });
    
    // Enter key for chat
    if (document.getElementById("chat-input")) {
        document.getElementById("chat-input").addEventListener("keypress", function(event) {
            if (event.key === "Enter") {
                event.preventDefault();
                sendChat();
            }
        });
    }
    
    // Tab switching
    if (document.querySelectorAll(".tab").length > 0) {
        document.querySelectorAll(".tab").forEach(tab => {
            tab.addEventListener("click", function() {
                // Remove active class from all tabs
                document.querySelectorAll(".tab").forEach(t => {
                    t.classList.remove("active");
                });
                
                // Add active class to clicked tab
                this.classList.add("active");
                
                // Hide all tab content
                document.querySelectorAll(".tab-content").forEach(content => {
                    content.classList.remove("active");
                });
                
                // Show corresponding tab content
                const targetId = this.getAttribute("data-tab");
                document.getElementById(targetId).classList.add("active");
            });
        });
    }
    
    // Initialize TROVO animation with enhanced smoothness
    initTrovoAnimation();
    
    // Add subtle particle animation to chat background
    initChatAnimation();
});

// Add this function for the TROVO animation
function initTrovoAnimation() {
    const title = document.querySelector("#os-phrases h2");
    if (!title) return;
    
    // Split the text into individual letters for animation
    const text = title.textContent;
    title.innerHTML = '';
    
    // Create spans for each letter with nested structure for animation
    for (let i = 0; i < text.length; i++) {
        const outerSpan = document.createElement('span');
        const middleSpan = document.createElement('span');
        const innerSpan = document.createElement('span');
        
        innerSpan.textContent = text[i];
        middleSpan.appendChild(innerSpan);
        outerSpan.appendChild(middleSpan);
        title.appendChild(outerSpan);
        
        // Add staggered delay to each letter for smoother effect
        innerSpan.style.animationDelay = `${i * 0.15}s`;
    }
    
    // Initialize the subtitle typing animation after TROVO animation
    setTimeout(() => {
        consoleText(['Trusted Resource for Omics and Variant Overview'], 'text', ['#656565']);
    }, text.length * 150 + 500); // Start after TROVO animation is mostly complete
}

// Subtitle typing animation function
function consoleText(words, id, colors) {
    if (colors === undefined) colors = ['#656565'];
    
    var visible = true;
    var con = document.getElementById('console');
    var letterCount = 1;
    var x = 1;
    var waiting = false;
    var target = document.getElementById(id);
    
    target.setAttribute('style', 'color:' + colors[0]);
    
    window.setInterval(function() {
        if (letterCount === 0 && waiting === false) {
            waiting = true;
            target.innerHTML = words[0].substring(0, letterCount);
            window.setTimeout(function() {
                var usedColor = colors.shift();
                colors.push(usedColor);
                var usedWord = words.shift();
                words.push(usedWord);
                x = 1;
                target.setAttribute('style', 'color:' + colors[0]);
                letterCount += x;
                waiting = false;
            }, 1000);
        } else if (letterCount === words[0].length + 1 && waiting === false) {
            waiting = true;
            window.setTimeout(function() {
                // Don't reset the text, keep it visible
                waiting = false;
            }, 1000);
        } else if (waiting === false) {
            target.innerHTML = words[0].substring(0, letterCount);
            letterCount += x;
        }
    }, 80); // Faster typing speed
    
    window.setInterval(function() {
        if (visible === true) {
            con.className = 'console-underscore hidden';
            visible = false;
        } else {
            con.className = 'console-underscore';
            visible = true;
        }
    }, 400);
}

// Function to add subtle particle animation to chat background
function initChatAnimation() {
    const chatMessages = document.querySelector('.chat-messages');
    if (!chatMessages) return;
    
    // Create particles
    for (let i = 0; i < 15; i++) {
        createParticle(chatMessages);
    }
}

// Create floating particle in chat background
function createParticle(container) {
    const particle = document.createElement('div');
    particle.className = 'chat-particle';
    
    // Random size between 3-8px
    const size = Math.random() * 5 + 3;
    
    // Random position
    const posX = Math.random() * 100;
    const posY = Math.random() * 100;
    
    // Random opacity
    const opacity = Math.random() * 0.07 + 0.03;
    
    // Random animation duration
    const duration = Math.random() * 20 + 10;
    
    // Styling
    particle.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        background-color: #2D9951;
        border-radius: 50%;
        top: ${posY}%;
        left: ${posX}%;
        opacity: ${opacity};
        pointer-events: none;
        z-index: 1;
        animation: floatParticle ${duration}s infinite ease-in-out;
    `;
    
    container.appendChild(particle);
}

// Add this to your stylesheet
const style = document.createElement('style');
style.textContent = `
@keyframes floatParticle {
    0%, 100% {
        transform: translateY(0) translateX(0);
    }
    25% {
        transform: translateY(-20px) translateX(10px);
    }
    50% {
        transform: translateY(0) translateX(20px);
    }
    75% {
        transform: translateY(20px) translateX(10px);
    }
}
`;
document.head.appendChild(style);