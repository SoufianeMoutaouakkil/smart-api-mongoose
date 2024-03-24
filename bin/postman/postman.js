const generatePostmanCollection = (data) => {
    const { name, ressources } = data;
    const collection = {};
    const collectionInfo = getCollectionInfo(name);
    const collectionVars = getCollectionVars(ressources);
    const collectionItems = getCollectionFolders(ressources);
    collection.info = collectionInfo;
    collection.item = collectionItems;
    collection.variable = collectionVars;
    return collection;
  };
  
  const getCollectionInfo = (name) => {
    return {
      name,
      schema:
        "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
    };
  };
  
  const getCollectionVars = (ressources) => {
    const ressourcesVars = getRessourcesVars(ressources);
    const defaultVars = getCollectionVarsDefault();
  
    // concat default vars with ressources vars
    const vars = [...defaultVars, ...ressourcesVars];
  
    return vars.map((variable) => {
      return {
        key: variable.key,
        value: variable.value,
        type: variable.type,
      };
    });
  };
  
  const getRessourcesVars = (ressources) => {
    return ressources.map((ressource) => {
      return {
        key: `${ressource}_url`,
        value: `{{api_url}}/${ressource}`,
        type: "string",
      };
    });
  };
  
  const getCollectionVarsDefault = () => {
    return [
      {
        key: "port",
        value: "5000",
        type: "string",
      },
      {
        key: "api_name",
        value: "my-api",
        type: "string",
      },
      {
        key: "api_domaine",
        value: "http://localhost",
        type: "string",
      },
      {
        key: "base_url",
        value: "{{api_domaine}}:{{port}}/{{api_name}}",
        type: "string",
      },
      {
        key: "api_version",
        value: "v1",
        type: "string",
      },
      {
        key: "api_url",
        value: "{{base_url}}/api/{{api_version}}",
        type: "string",
      },
      {
        key: "TOKEN",
        value: "",
        type: "string",
      },
      {
        key: "auth_url",
        value: "{{base_url}}/auth",
        type: "string",
      },
    ];
  };
  
  const getCollectionFolders = (ressources) => {
    const ressourcesForders = ressources.map((ressource) => {
      return {
        name: ressource,
        item: getRessourceItems(ressource),
      };
    });
  
    const authFolder = getAuthFolder();
  
    return [authFolder, ...ressourcesForders];
  };
  
  const getAuthFolder = () => {
    return {
      name: "Auth",
      item: getAuthItems(),
    };
  };
  
  const getAuthItems = () => {
    return [
      {
        name: "Register",
        event: getRessourceItemEvent(),
        request: {
          method: "POST",
          url: "{{auth_url}}/register",
          header: [],
          body: getBody({
            username: "user",
            password: "password",
          }),
          response: [],
        },
      },
      {
        name: "Login",
        event: getRessourceItemEvent(),
        request: {
          method: "POST",
          url: "{{auth_url}}/login",
          header: [],
          body: getBody({
            username: "user",
            password: "password",
          }),
          response: [],
        },
      },
    ];
  };
  
  const getRessourceItemsConfig = () => {
    return [
      {
        name: "getAll",
        method: "GET",
        path: "/",
        body: {},
      },
      {
        name: "getById",
        method: "GET",
        path: "/:id",
        body: {},
      },
      {
        name: "getByQuery",
        method: "GET",
        path: "?query=example",
        body: {},
      },
      {
        name: "getByIds",
        method: "GET",
        path: "?ids=1,2,3",
        body: {},
      },
      {
        name: "create",
        method: "POST",
        path: "/",
        body: {
          data: {
            key: "value",
          },
        },
      },
      {
        name: "createMany",
        method: "POST",
        path: "/",
        body: {
          data: [
            {
              key: "value",
            },
          ],
        },
      },
      {
        name: "import",
        method: "POST",
        path: "/import",
        body: {},
      },
      {
        name: "updateAll",
        method: "PUT",
        path: "/",
        body: {
          data: {
            key: "value",
          },
        },
      },
      {
        name: "updateById",
        method: "PUT",
        path: "/:id",
        body: {
          data: {
            key: "value",
          },
        },
      },
      {
        name: "updateByQuery",
        method: "PUT",
        path: "?query=example",
        body: {
          data: {
            key: "value",
          },
        },
      },
      {
        name: "updateByIds",
        method: "PUT",
        path: "?ids=1,2,3",
        body: {
          data: {
            key: "value",
          },
        },
      },
      {
        name: "deleteById",
        method: "DELETE",
        path: "/:id",
        body: {},
      },
      {
        name: "deleteByQuery",
        method: "DELETE",
        path: "?query=example",
        body: {},
      },
      {
        name: "deleteByIds",
        method: "DELETE",
        path: "?ids=1,2,3",
        body: {},
      },
    ];
  };
  
  const getRessourceItems = (ressource) => {
    const config = getRessourceItemsConfig();
    return config.map((item) => {
      return {
        name: item.name,
        event: getRessourceItemEvent(),
        protocolProfileBehavior: {
          disableBodyPruning: true,
        },
        request: {
          auth: getRessourceItemAuth(),
          method: item.method,
          url: `{{${ressource}_url}}${item.path}`,
          header: [],
          body: getBody(item.body),
          response: [],
        },
      };
    });
  };
  
  const getRessourceItemAuth = () => {
    return {
      type: "bearer",
      bearer: [
        {
          key: "token",
          value: "{{TOKEN}}",
          type: "string",
        },
      ],
    };
  };
  
  const getRessourceItemEvent = () => {
    return [
      {
        listen: "test",
        script: {
          exec: [
            "const body = pm.response.json()\r",
            "var token = body.token\r",
            "if (token)\r",
            '    pm.collectionVariables.set("TOKEN", token)\r',
            "",
          ],
          type: "text/javascript",
          packages: {},
        },
      },
    ];
  };
  
  const getBody = (body) => {
    return {
      mode: "raw",
      raw: JSON.stringify(body),
      options: {
        raw: {
          language: "json",
        },
      },
    };
  };
  
  module.exports = generatePostmanCollection;
  