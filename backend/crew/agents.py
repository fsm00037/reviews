# Agent definitions for product review system

import glob
import os
from crewai import Agent, LLM
from crewai_tools import ScrapeWebsiteTool , FileReadTool, DirectoryReadTool
from typing import List, Dict, Any
import config
from crewai.tools import tool

@tool("leerReviews")
def leer_reviews() -> dict:
    """
    Lee todos los archivos de revisiones (.md) del directorio de revisiones y devuelve
    su contenido completo. Útil para obtener el texto completo de todas las revisiones
    en un solo paso sin necesidad de listar primero los archivos y luego leerlos individualmente.
    
    Returns:
        Un diccionario donde las claves son los nombres de los archivos y
        los valores son el contenido completo de cada archivo de revisión.
    """
    reviews_content = {}
    
    # Buscar todos los archivos .md en el directorio de revisiones
    review_files = glob.glob(os.path.join(config.REVIEWS_DIR, "*.md"))
    
    for file_path in review_files:
        file_name = os.path.basename(file_path)
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                content = file.read()
                reviews_content[file_name] = content
        except Exception as e:
            reviews_content[file_name] = f"Error al leer el archivo: {str(e)}"
    
    return reviews_content
    
def create_llm(model_name=None):
    """Create and return an LLM instance"""
    return LLM(
        model=model_name or config.DEFAULT_MODEL,
        temperature=1,
    )

def create_product_info_agent(llm=None):
    """Create and return the product information agent"""
    if llm is None:
        llm = create_llm()
        
    scrape_tool = ScrapeWebsiteTool()
    
    return Agent(
        llm=llm,
        role=config.AGENT_CONFIG["product_info"]["role"],
        goal=config.AGENT_CONFIG["product_info"]["goal"],
        backstory=config.AGENT_CONFIG["product_info"]["backstory"],
        verbose=True,
        allow_delegation=False,
        tools=[scrape_tool]
    )

def create_user_creator_agent(llm=None):
    """Create and return the user profile creator agent"""
    if llm is None:
        llm = create_llm()
        
    return Agent(
        llm=llm,
        role=config.AGENT_CONFIG["user_creator"]["role"],
        goal=config.AGENT_CONFIG["user_creator"]["goal"],
        backstory=config.AGENT_CONFIG["user_creator"]["backstory"],
        verbose=True,
        allow_delegation=False
    )

def create_reviewer_agents(profiles: List[Dict[str, Any]], llm=None):
    """Create and return reviewer agents based on user profiles"""
    if llm is None:
        llm = create_llm()
    
    agents = []
    for profile in profiles:
        agent = Agent(
            llm=llm,
            role=f"{config.AGENT_CONFIG['reviewer']['role']} - {profile['name']}",
            goal=config.AGENT_CONFIG["reviewer"]["goal"],
            backstory=profile['backstory'],
            verbose=True,
            allow_delegation=False
        )
        agents.append(agent)
    
    return agents

def create_compiler_agent(llm=None):
    """Create and return the review compiler agent with the combined review reading tool"""
    from crewai import Agent, LLM
    
    if llm is None:
        llm = LLM(model=config.DEFAULT_MODEL)
        
    return Agent(
        llm=llm,
        role=config.AGENT_CONFIG["compiler"]["role"],
        goal=config.AGENT_CONFIG["compiler"]["goal"],
        backstory=config.AGENT_CONFIG["compiler"]["backstory"],
        verbose=True,
        allow_delegation=False,
        tools=[leer_reviews]  
    )
