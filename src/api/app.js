import request from '@/utils/request'

export function getAppList(parms) {
  return request({
    url: '/app',
    method: 'get',
    params: parms
  })
}

// 根据主键删除应用
export function deleteApp(id) {
  return request({
    url: '/app/' + id,
    method: 'delete'
  })
}

// 添加应用
export function addApp(data) {
  return request({
    url: '/app',
    method: 'post',
    data: data
  })
}

/**
 * 更新应用
 * @param data
 */
export function updateApp(data) {
  return request({
    url: 'app',
    method: 'put',
    data: data
  })
}

export function deleteVehiclds(ids) {
  return request({
    url: '/app/batch',
    method: 'delete',
    data: ids
  })
}

