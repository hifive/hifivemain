/*
 * Copyright (C) 2012 NS Solutions Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License"),
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * hifive
 */

h5.u.obj.expose('ERRCODE.h5scopeglobals', {
	ERR_CODE_INVALID_ARGS_ADDEVENTLISTENER: 100
});

h5.u.obj.expose('ERRCODE.h5.api.geo', {
	ERR_CODE_INVALID_COORDS: 2000,
	ERR_CODE_INVALID_GEOSYSTEM_CONSTANT: 2001,
	ERR_CODE_POSITIONING_FAILURE: 2002
});

h5.u.obj.expose('ERRCODE.h5.api.sqldb', {
	ERR_CODE_RETRY_SQL: 3000,
	ERR_CODE_INVALID_TABLE_NAME: 3001,
	ERR_CODE_INVALID_TRANSACTION_TYPE: 3002,
	ERR_CODE_INVALID_OPERATOR: 3003,
	ERR_CODE_INVALID_PARAM_TYPE: 3004,
	ERR_CODE_INVALID_COLUMN_NAME: 3005,
	ERR_CODE_INVALID_VALUES: 3006,
	ERR_CODE_INVALID_STATEMENT: 3007,
	ERR_CODE_TYPE_NOT_ARRAY: 3008,
	ERR_CODE_INVALID_TRANSACTION_TARGET: 3009,
	ERR_CODE_TRANSACTION_PROCESSING_FAILURE: 3010,
	ERR_CODE_INVALID_COLUMN_NAME_IN_WHERE: 3011
});

h5.u.obj.expose('ERRCODE.h5.ajax', {
	ERR_CODE_NOT_ARRAY: 5000
});

h5.u.obj.expose('ERRCODE.h5.core.controller', {
	ERR_CODE_INVALID_TEMPLATE_SELECTOR: 6000,
	ERR_CODE_BIND_TARGET_REQUIRED: 6001,
	ERR_CODE_BIND_NOT_CONTROLLER: 6002,
	ERR_CODE_BIND_NO_TARGET: 6003,
	ERR_CODE_BIND_TOO_MANY_TARGET: 6004,
	ERR_CODE_TOO_FEW_ARGUMENTS: 6005,
	ERR_CODE_INVALID_CONTROLLER_NAME: 6006,
	ERR_CODE_CONTROLLER_INVALID_INIT_PARAM: 6007,
	ERR_CODE_CONTROLLER_ALREADY_CREATED: 6008,
	ERR_CODE_CONTROLLER_CIRCULAR_REF: 6009,
	ERR_CODE_LOGIC_CIRCULAR_REF: 6010,
	ERR_CODE_CONTROLLER_SAME_PROPERTY: 6011,
	ERR_CODE_EVENT_HANDLER_SELECTOR_THIS: 6012,
	ERR_CODE_SAME_EVENT_HANDLER: 6013,
	ERR_CODE_CONTROLLER_META_KEY_INVALID: 6014,
	ERR_CODE_CONTROLLER_META_KEY_NULL: 6015,
	ERR_CODE_CONTROLLER_META_KEY_NOT_CONTROLLER: 6016,
	ERR_CODE_INVALID_LOGIC_NAME: 6017,
	ERR_CODE_LOGIC_ALREADY_CREATED: 6018,
	ERR_CODE_EXPOSE_NAME_REQUIRED: 6019,
	ERR_CODE_NOT_VIEW: 6029,
	ERR_CODE_BIND_TARGET_ILLEGAL: 6030
});

h5.u.obj.expose('ERRCODE.h5.core.view', {
	ERR_CODE_TEMPLATE_COMPILE: 7000,
	ERR_CODE_TEMPLATE_FILE: 7001,
	ERR_CODE_TEMPLATE_INVALID_ID: 7002,
	ERR_CODE_TEMPLATE_AJAX: 7003,
	ERR_CODE_INVALID_FILE_PATH: 7004,
	ERR_CODE_TEMPLATE_ID_UNAVAILABLE: 7005,
	ERR_CODE_TEMPLATE_PROPATY_UNDEFINED: 7006,
	ERR_CODE_BIND_INVALID_TARGET: 7007,
	ERR_CODE_TOO_MANY_TARGETS: 7008,
	ERR_CODE_BIND_CONTEXT_INVALID: 7009
});

h5.u.obj.expose('ERRCODE.h5.log', {
	ERR_CODE_LOG_TARGET_TYPE: 10000,
	ERR_CODE_CATEGORY_NAMED_MULTIPLE_TIMES: 10002,
	ERR_CODE_LEVEL_INVALID: 10003,
	ERR_CODE_LOG_TARGETS_IS_NONE: 10004,
	ERR_CODE_CATEGORY_INVALID: 10005,
	ERR_CODE_LOG_TARGETS_NAMED_MULTIPLE_TIMES: 10007,
	ERR_CODE_LOG_TARGETS_INVALID: 10008,
	ERR_CODE_LOG_TARGET_INVALID: 10009,
	ERR_CODE_OUT_CATEGORY_INVALID: 10010
});

h5.u.obj.expose('ERRCODE.h5.u', {
	ERR_CODE_NAMESPACE_INVALID: 11000,
	ERR_CODE_NAMESPACE_EXIST: 11001,
	ERR_CODE_SERIALIZE_FUNCTION: 11002,
	ERR_CODE_SERIALIZE_VERSION: 11003,
	ERR_CODE_DESERIALIZE_TYPE: 11004,
	ERR_CODE_CIRCULAR_REFERENCE: 11005,
	ERR_CODE_DESERIALIZE_VALUE: 11006,
	ERR_CODE_INVALID_SCRIPT_PATH: 11007,
	ERR_CODE_INVALID_OPTION: 11008,
	ERR_CODE_DESERIALIZE_ARGUMENT: 11009,
	ERR_CODE_SCRIPT_FILE_LOAD_FAILD: 11010,
	ERR_CODE_REQUIRE_SCHEMA: 11011
});

h5.u.obj.expose('ERRCODE.h5.core.data', {
	ERR_CODE_INVALID_MANAGER_NAME: 15000,
	ERR_CODE_INVALID_ITEM_VALUE: 15001,
	ERR_CODE_DEPEND_PROPERTY: 15002,
	ERR_CODE_NO_EVENT_TARGET: 15003,
	ERR_CODE_INVALID_DESCRIPTOR: 15004,
	ERR_CODE_INVALID_MANAGER_NAMESPACE: 15005,
	ERR_CODE_INVALID_DATAMODEL_NAME: 15006,
	ERR_CODE_NO_ID: 15007,
	ERR_CODE_REGISTER_TARGET_ALREADY_EXIST: 15008,
	ERR_CODE_ID_MUST_BE_STRING: 15010,
	ERR_CODE_CANNOT_SET_ID: 15012,
	ERR_CODE_CALC_RETURNED_INVALID_VALUE: 15013,
	ERR_CODE_CANNOT_CALC_DEPEND: 15014,
	ERR_CODE_CANNOT_CHANGE_REMOVED_ITEM: 15015,
	ERR_CODE_CANNOT_CHANGE_DROPPED_MODEL: 15016,
	ERR_CODE_CANNOT_SET_NOT_DEFINED_PROPERTY: 15017
});

h5.u.obj.expose('ERRCODE.h5.core.view_binding', {
	ERR_CODE_REQUIRE_DETAIL: 16000,
	ERR_CODE_UNKNOWN_BIND_DIRECTION: 16001,
	ERR_CODE_INVALID_CONTEXT_SRC: 16002
});
