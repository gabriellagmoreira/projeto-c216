from flask import Flask, render_template, request, redirect, url_for, jsonify
import requests
import os

app = Flask(__name__)

# Definindo as variáveis de ambiente
API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:5000/api/v1/consulta")
API_DATABASE_RESET = os.getenv("API_DATABASE_RESET", "http://localhost:5000/api/v1/database/reset")

# Rota para a página inicial
@app.route('/')
def index():
    return render_template('index.html')

# Rota para exibir o formulário de cadastro
@app.route('/inserir', methods=['GET'])
def inserir_consulta_form():
    return render_template('inserir.html')

# Rota para enviar os dados do formulário de cadastro para a API
@app.route('/inserir', methods=['POST'])
def inserir_consulta():
    payload = {
        'nome': request.form['nome'],
        'data_nascimento': request.form['data_nascimento'],
        'data_atendimento': request.form['data_atendimento'],
        'horario': request.form['horario'],
        'tipo': request.form['tipo']
    }

    response = requests.post(f'{API_BASE_URL}/inserir', json=payload)
    
    if response.status_code == 201:
        return redirect(url_for('listar_consultas'))
    else:
        return f"Erro ao inserir consulta: {response.json()}", 500

# Rota para listar todas as consultas
@app.route('/listar', methods=['GET'])
def listar_consultas():
    response = requests.get(f'{API_BASE_URL}/listar')
    consultas = response.json()
    return render_template('listar.html', consultas=consultas)

# Rota para exibir o formulário de edição de consulta
@app.route('/atualizar/<int:consulta_id>', methods=['GET'])
def atualizar_consulta_form(consulta_id):
    response = requests.get(f"{API_BASE_URL}/listar")
    consultas = [consulta for consulta in response.json() if consulta['id'] == consulta_id]
    if len(consultas) == 0:
        return "Consulta não encontrada", 404
    consulta = consultas[0]
    return render_template('atualizar.html', consulta=consulta)

# Rota para enviar os dados do formulário de edição de consulta para a API
@app.route('/atualizar/<int:consulta_id>', methods=['POST'])
def atualizar_consulta(consulta_id):
    payload = {
        'id': consulta_id,
        'nome': request.form['nome'],
        'data_nascimento': request.form['data_nascimento'],
        'data_atendimento': request.form['data_atendimento'],
        'horario': request.form['horario'],
        'tipo': request.form['tipo']
    }

    response = requests.post(f"{API_BASE_URL}/atualizar", json=payload)
    
    if response.status_code == 200:
        return redirect(url_for('listar_consultas'))
    else:
        return "Erro ao atualizar consulta", 500

# Rota para excluir uma consulta
@app.route('/excluir/<int:consulta_id>', methods=['POST'])
def excluir_consulta(consulta_id):
    #payload = {'id': consulta_id}
    payload = {'id': consulta_id}
    
    response = requests.delete(f"{API_BASE_URL}/excluir", json=payload)
    
    if response.status_code == 200:
        return redirect(url_for('listar_consultas'))
    else:
        return "Erro ao excluir consulta", 500

# Rota para resetar o banco de dados
@app.route('/reset-database', methods=['GET'])
def resetar_database():
    response = requests.delete(API_DATABASE_RESET)
    
    if response.status_code == 200:
        return redirect(url_for('index'))
    else:
        return "Erro ao resetar o banco de dados", 500

if __name__ == '__main__':
    app.run(debug=True, port=3000, host='0.0.0.0')
