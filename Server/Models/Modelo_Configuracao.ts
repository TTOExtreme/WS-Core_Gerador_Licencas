import { uint16 } from "../@Types/Tipo_Inteiros";


class Modelo_Config {
    public Modulo: Config_Modulo = new Config_Modulo();
    /** Marcador de instalação: quando false, a inicialização cria e popula as tabelas e então marca true. */
    public Instalado: boolean = false;
    public Core: Config_Core = new Config_Core();
    public BD: Config_BD = new Config_BD();
    public LOG: Config_Log = new Config_Log();
    public Licenciamento: Config_Licenciamento = new Config_Licenciamento();
}

class Config_Modulo {
    public ID: string = "";
}

class Config_Core {
    /** Host/URL do módulo Core do WSCore ao qual este módulo se conecta. */
    public Host: string = "127.0.0.1";
    /** Porta do Core do WSCore. */
    public Porta: number = 7000;
}

class Config_BD {
    public Usuario: string = "";
    public Senha: string = "";
    public Database: string = "wscore_rh";
    public Host: string = "localhost";
    public Porta: uint16 = new uint16(3306);
}

class Config_Log {
    public Console: boolean = true;
    public Arquivo: boolean = true;
    public LocalArquivo: string = "/var/log/wscore_rh/";
    public Rotatividade: number = 86400;
}

class Config_Licenciamento {
    /** Porta HTTPS da API de Licenciamento (servidor apartado, mesmo processo). */
    public Porta: number = 8779;
    public Cert: Config_Licenciamento_Cert = new Config_Licenciamento_Cert();
}
class Config_Licenciamento_Cert {
    public Key: string = "./Certs/licenciamento.key";
    public Cert: string = "./Certs/licenciamento.crt";
    public GerarSeAusente: boolean = true;
}

export { Modelo_Config, Config_Core, Config_Licenciamento }