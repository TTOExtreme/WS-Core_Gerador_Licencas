import * as fs from 'fs';
import { Logger } from './Controllers/Lib/Logger';
import { Modelo_Config } from './Models/Modelo_Configuracao';
import Modelo_Config_JSON from './Models/Modelo_Config_JSON.json';
import { Conector_Mysql } from './Controllers/Lib/Conector_Mysql';
import { uint16 } from './@Types/Tipo_Inteiros';
import { Socket_Client } from './Controllers/Modulos/Socket_Client';
import { Modulos_Struct } from './Models/Modulos/Modulos_Struct';
import { Cadastro_Dados_Banco } from './Controllers/Cadastro_Dados_Banco';
import { LoggerDB } from './Controllers/Lib/LoggerDB';
import { AuditDB } from './Controllers/Lib/AuditDB';
import { Socket_WebFiles } from './Controllers/_WebFiles/Socket_WebFiles';
import { Socket_Clientes } from './Controllers/_WSGL_Clientes/Socket_Clientes';
import { Socket_Contratos } from './Controllers/_WSGL_Contratos/Socket_Contratos';
import { Socket_Ambientes } from './Controllers/_WSGL_Ambientes/Socket_Ambientes';
import { Socket_Clusters } from './Controllers/_WSGL_Clusters/Socket_Clusters';
import { Socket_Licencas } from './Controllers/_WSGL_Licencas/Socket_Licencas';
import { Servidor_Licenciamento } from './Controllers/_WSGL_Licencas/Servidor_Licenciamento';
import { Socket_Dashboard } from './Controllers/_WSGL_Dashboard/Socket_Dashboard';
import { Socket_Monitoramento } from './Controllers/_WSGL_Monitoramento/Socket_Monitoramento';

const _Logger: Logger = new Logger();
let _Config: Modelo_Config;
let _BD: Conector_Mysql;
let _Core_Conection: Socket_Client;

function InicializarConfiguracao() {
    if (!fs.existsSync(__dirname + '/config/')) {
        try { fs.mkdirSync(__dirname + '/config/'); }
        catch (err) { _Logger.Error('ao criar pasta de configuração', err); process.abort(); }
    }
    if (!fs.existsSync(__dirname + '/config/config.cfg')) {
        try {
            _Logger.Info('Criado novo arquivo de configuração em:', __dirname + '/config/config.cfg');
            fs.writeFileSync(__dirname + '/config/config.cfg', JSON.stringify(Modelo_Config_JSON, null, 4));
            process.exit(1);
        } catch (err) { _Logger.Error('ao criar config.cfg', err); process.exit(1); }
    }
    const configDisco = JSON.parse(fs.readFileSync(__dirname + '/config/config.cfg').toString());
    _Config = { ...Modelo_Config_JSON, ...configDisco } as Modelo_Config;
    (Object.keys(Modelo_Config_JSON) as Array<keyof typeof Modelo_Config_JSON>).forEach((secao) => {
        const defaultSecao = (Modelo_Config_JSON as Record<string, unknown>)[secao as string];
        const discoSecao = (configDisco as Record<string, unknown>)[secao as string];
        if (defaultSecao && typeof defaultSecao === 'object' && !Array.isArray(defaultSecao)) {
            (_Config as unknown as Record<string, unknown>)[secao as string] = { ...(defaultSecao as object), ...((discoSecao as object) ?? {}) };
        }
    });
}

function InicializarBanco(): Promise<void> {
    return new Promise<void>((resolv) => {
        _BD = new Conector_Mysql(_Config.BD.Usuario, _Config.BD.Senha, _Config.BD.Database, _Config.BD.Host, _Config.BD.Porta);
        _BD.Conectar().then(() => resolv()).catch((err) => _Logger.Error(err));
    });
}

function PersistirIdModulo(id: string) {
    _Config.Modulo.ID = id;
    const configPath = __dirname + '/config/config.cfg';
    const configDisco = JSON.parse(fs.readFileSync(configPath).toString());
    configDisco.Modulo = { ...configDisco.Modulo, ID: id };
    fs.writeFileSync(configPath, JSON.stringify(configDisco, null, 4));
    _Logger.System('[Config] ID do módulo salvo:', id);
}

function InicializarSocketServer(): Promise<void> {
    return new Promise<void>((resolv) => {
        const idConfig = _Config.Modulo?.ID ?? '';
        const ModData: Modulos_Struct = new Modulos_Struct(idConfig);
        ModData.Modulo_Nome = 'WSCore_GeradorLicencas';
        ModData.Modulo_Descricao = 'Módulo Gerador de Licenças (emissor central)';
        ModData.Modulo_Versao = '1.1.0';
        if (!idConfig) { ModData.Modulo_ID = ''; }

        _Core_Conection = new Socket_Client(new uint16(_Config.Core.Porta), _Config.Core.Host, ModData);
        _Core_Conection.onNovoID((id) => PersistirIdModulo(id));
        _Core_Conection.Connect().then(() => resolv()).catch((err) => _Logger.Error('ao conectar no Core', err));
    });
}

function MarcarInstalado() {
    _Config.Instalado = true;
    const configPath = __dirname + '/config/config.cfg';
    const configDisco = JSON.parse(fs.readFileSync(configPath).toString());
    configDisco.Instalado = true;
    fs.writeFileSync(configPath, JSON.stringify(configDisco, null, 4));
    _Logger.System('[Install] Flag "Instalado" marcada como true em config.cfg');
}

InicializarConfiguracao();
InicializarBanco().then(async () => {
    const _CadastroBanco = new Cadastro_Dados_Banco(_Config, _BD);
    await _CadastroBanco.Inicializar_Tabelas();
    await _CadastroBanco.Inicializar_Dados();
    if (!_Config.Instalado) { MarcarInstalado(); }

    Logger.SetDB(new LoggerDB(_BD));
    AuditDB.Inicializar(_BD, '_Mod_WSGL_Auditoria');

    // API de Licenciamento: servidor HTTPS apartado (porta/cert do config), no mesmo
    // processo mas independente da conexao com o Core. Uma falha aqui (ex.: certificado
    // ausente com GerarSeAusente=false) nao deve abortar o bootstrap dos sockets admin.
    try {
        new Servidor_Licenciamento(_Config, _BD).Iniciar();
    } catch (err) {
        _Logger.Error('[Licenciamento] API nao iniciada', err);
    }

    InicializarSocketServer().then(async () => {
        new Socket_WebFiles(_Config, _BD, _Core_Conection).Inicializar_Listeners();
        new Socket_Clientes(_Config, _BD, _Core_Conection).Inicializar_Listeners();
        new Socket_Contratos(_Config, _BD, _Core_Conection).Inicializar_Listeners();
        new Socket_Ambientes(_Config, _BD, _Core_Conection).Inicializar_Listeners();
        new Socket_Clusters(_Config, _BD, _Core_Conection).Inicializar_Listeners();
        new Socket_Licencas(_Config, _BD, _Core_Conection).Inicializar_Listeners();
        new Socket_Dashboard(_Config, _BD, _Core_Conection).Inicializar_Listeners();
        new Socket_Monitoramento(_Config, _BD, _Core_Conection).Inicializar_Listeners();
        _Logger.System('[Gerador] Módulo Gerador de Licenças inicializado.');
    }).catch((err) => _Logger.Error('Ao iniciar o Core', err));
}).catch((err) => _Logger.Error('Ao conectar no banco de dados', err));
